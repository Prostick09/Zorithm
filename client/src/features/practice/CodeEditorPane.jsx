import { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import './CodeEditorPane.css';
import { useChat } from '../chat/ChatContext';

const DEFAULT_CODE = `function solve(arr) {
  // Write your logic here
  
  return arr;
}
`;

function getTestCasesForAlgo(algoId) {
  // We can scale this based on activeVisualization / ChatContext
  switch (algoId) {
    case 'bubbleSort':
    case 'selectionSort':
    case 'insertionSort':
      return [
        { input: [5, 4, 3, 2, 1], expected: [1, 2, 3, 4, 5] },
        { input: [100, 10, 40, 20], expected: [10, 20, 40, 100] }
      ];
    default:
      // Generic fallback
      return [
        { input: [1, 2, 3], expected: [1, 2, 3] }
      ];
  }
}

export default function CodeEditorPane() {
  const { activeVisualization, sendMessage, activeMode } = useChat();
  const [code, setCode] = useState(DEFAULT_CODE);
  const [outputResult, setOutputResult] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  
  // Track worker to terminate on timeouts
  const workerRef = useRef(null);

  useEffect(() => {
    // Reset output when algorithm changes
    setOutputResult(null);
  }, [activeVisualization]);

  const handleRunCode = () => {
    if (!code) return;
    setIsEvaluating(true);
    setOutputResult(null);

    // Create web worker
    workerRef.current = new Worker(new URL('./executorWorker.js', import.meta.url), { type: 'module' });

    // Handle incoming messages
    workerRef.current.onmessage = (e) => {
      setIsEvaluating(false);
      const { success, message, error } = e.data;
      
      if (success) {
        setOutputResult({ success: true, message });
      } else {
        setOutputResult({ success: false, message: error });
        // Phase 2: AI Feedback Integration
        handleAIFeedback(error);
      }
      workerRef.current.terminate();
    };

    // Failsafe timeout (e.g., in case of an extremely complex infinite loop freezing the worker)
    setTimeout(() => {
      if (isEvaluating && workerRef.current) {
         workerRef.current.terminate();
         setIsEvaluating(false);
         const errMsg = "Execution taking too long! Possible infinite loop detected.";
         setOutputResult({ success: false, message: errMsg });
         handleAIFeedback(errMsg);
      }
    }, 3000);

    // Provide the test cases based on the current context topic
    const testCases = getTestCasesForAlgo(activeVisualization);
    
    // Fire the worker
    workerRef.current.postMessage({ code, testCases });
  };

  const handleAIFeedback = (errorMsg) => {
    // Quietly ask the chatbot context to explain the mistake (Simulating a message send)
    const prompt = `My code failed during execution. Given the context of what we are doing:
    
My Code:
\`\`\`javascript
${code}
\`\`\`

The Error/Output:
${errorMsg}

Please explain my mistake and suggest a fix.`;

    sendMessage(prompt);
  };

  if (activeMode !== 'Code') return null; // Fallback, handled by CSS/Router usually

  return (
    <div className="editor-pane">
      <div className="editor-header">
        <h3>Practice Sandbox</h3>
        <span className="algo-badge">{activeVisualization || 'Unknown Target'}</span>
      </div>
      
      <div className="editor-container">
        <Editor
          height="100%"
          defaultLanguage="javascript"
          theme="vs-dark"
          value={code}
          onChange={(value) => setCode(value)}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            padding: { top: 16 }
          }}
        />
      </div>

      <div className="editor-footer">
        <button 
          className="run-btn" 
          onClick={handleRunCode} 
          disabled={isEvaluating}
        >
          {isEvaluating ? 'Evaluating...' : '▶ Run Code'}
        </button>

        {outputResult && (
          <div className={`output-panel ${outputResult.success ? 'output-success' : 'output-fail'}`}>
            {outputResult.success ? '✅ ' : '❌ '}{outputResult.message}
          </div>
        )}
      </div>
    </div>
  );
}
