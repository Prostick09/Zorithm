import { useState, useRef, useEffect } from 'react'
import { useChat } from '../chat/ChatContext'
import './Visualizer.css'

// -- Generators -- //
function generateBubbleSortSteps(initialArray) {
  const steps = []
  const arr = [...initialArray]
  steps.push({ array: [...arr], comparing: [], sorted: [] })

  const n = arr.length
  let sorted = []
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      steps.push({ array: [...arr], comparing: [j, j + 1], sorted: [...sorted] })
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]]
        steps.push({ array: [...arr], comparing: [j, j + 1], swapped: true, sorted: [...sorted] })
      }
    }
    sorted.push(n - i - 1)
    steps.push({ array: [...arr], comparing: [], sorted: [...sorted] })
  }
  return steps
}

function generateSelectionSortSteps(initialArray) {
  const steps = []
  const arr = [...initialArray]
  steps.push({ array: [...arr], comparing: [], sorted: [] })

  const n = arr.length
  let sorted = []
  for (let i = 0; i < n; i++) {
    let minIdx = i
    for (let j = i + 1; j < n; j++) {
      steps.push({ array: [...arr], comparing: [minIdx, j], sorted: [...sorted] })
      if (arr[j] < arr[minIdx]) {
        minIdx = j
        steps.push({ array: [...arr], comparing: [minIdx], sorted: [...sorted] })
      }
    }
    if (minIdx !== i) {
      [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]]
      steps.push({ array: [...arr], comparing: [i, minIdx], swapped: true, sorted: [...sorted] })
    }
    sorted.push(i)
    steps.push({ array: [...arr], comparing: [], sorted: [...sorted] })
  }
  return steps
}

function generateInsertionSortSteps(initialArray) {
  const steps = []
  const arr = [...initialArray]
  steps.push({ array: [...arr], comparing: [], sorted: [] })

  const n = arr.length
  let sorted = [0] // First element is considered sorted
  for (let i = 1; i < n; i++) {
    let key = arr[i]
    let j = i - 1
    
    steps.push({ array: [...arr], comparing: [i], sorted: [...sorted] })
    
    while (j >= 0 && arr[j] > key) {
      steps.push({ array: [...arr], comparing: [j, j + 1], sorted: [...sorted] })
      arr[j + 1] = arr[j]
      steps.push({ array: [...arr], comparing: [j, j + 1], swapped: true, sorted: [...sorted] })
      j = j - 1
    }
    arr[j + 1] = key
    sorted.push(i)
    steps.push({ array: [...arr], comparing: [], sorted: [...sorted] })
  }
  return steps
}
// ----------------- //

export default function Visualizer({ title = "Algorithm Visualizer" }) {
  const { activeVisualization } = useChat()
  const [array, setArray] = useState([40, 15, 60, 25, 10, 50, 35])
  const [steps, setSteps] = useState([])
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(400)
  const [algoName, setAlgoName] = useState("Bubble Sort")
  
  const timerRef = useRef(null)

  // Initialization & Algorithm Switching
  useEffect(() => {
    let activeAlgo = activeVisualization || "bubbleSort"
    
    let generatedSteps = []
    if (activeAlgo === 'selectionSort') {
      generatedSteps = generateSelectionSortSteps(array)
      setAlgoName("Selection Sort")
    } else if (activeAlgo === 'insertionSort') {
      generatedSteps = generateInsertionSortSteps(array)
      setAlgoName("Insertion Sort")
    } else {
      // Default to bubble sort
      generatedSteps = generateBubbleSortSteps(array)
      setAlgoName("Bubble Sort")
    }
    
    setSteps(generatedSteps)
    setCurrentStep(0)
    setIsPlaying(false)
  }, [activeVisualization, array])

  // Auto-play interval
  useEffect(() => {
    if (isPlaying && currentStep < steps.length - 1) {
      timerRef.current = setTimeout(() => {
        setCurrentStep(prev => prev + 1)
      }, speed)
    } else if (currentStep >= steps.length - 1) {
      setIsPlaying(false)
    }
    return () => clearTimeout(timerRef.current)
  }, [isPlaying, currentStep, steps, speed])

  const handlePlayPause = () => setIsPlaying(!isPlaying)
  
  const handleReset = () => {
    setIsPlaying(false)
    setCurrentStep(0)
  }

  const handleStepForward = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1)
      setIsPlaying(false)
    }
  }

  const handleStepBackward = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
      setIsPlaying(false)
    }
  }

  const activeState = steps[currentStep] || { array, comparing: [], sorted: [] }
  const maxValue = Math.max(...array, 1)

  return (
    <div className="visualizer-pane">
      <div className="visualizer-header">
        <h3>{title}</h3>
        <span className="visualizer-badge">{algoName} Example</span>
      </div>

      <div className="visualizer-canvas">
        {activeState.array.map((val, idx) => {
          const isComparing = activeState.comparing?.includes(idx)
          const isSorted = activeState.sorted?.includes(idx)
          const height = `${(val / maxValue) * 100}%`

          let barClass = 'bar'
          if (isComparing) barClass += ' bar--comparing'
          else if (isSorted) barClass += ' bar--sorted'

          return (
            <div key={idx} className="bar-container">
              <span className="bar-value">{val}</span>
              <div 
                className={barClass} 
                style={{ height }}
                title={`Value: ${val}`}
              ></div>
            </div>
          )
        })}
      </div>

      <div className="visualizer-controls">
        <button className="ctrl-btn" onClick={handleReset} title="Reset">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
        </button>
        <button className="ctrl-btn" onClick={handleStepBackward} disabled={currentStep === 0} title="Previous Step">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/></svg>
        </button>
        <button className="ctrl-btn ctrl-btn--primary" onClick={handlePlayPause} title={isPlaying ? "Pause" : "Play"}>
          {isPlaying ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          )}
        </button>
        <button className="ctrl-btn" onClick={handleStepForward} disabled={currentStep >= steps.length - 1} title="Next Step">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
        </button>
      </div>
      
      <div className="visualizer-status">
        Step: {steps.length > 0 ? currentStep + 1 : 0} / {steps.length}
      </div>
    </div>
  )
}
