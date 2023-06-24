import React, { useEffect, useRef, useState } from "react";
import Codemirror from "codemirror";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/darcula.css";
import "codemirror/mode/javascript/javascript";
import "codemirror/addon/edit/closetag";
import "codemirror/addon/edit/closebrackets";
import "codemirror/addon/hint/show-hint";
import "codemirror/addon/hint/javascript-hint";
import { ACTIONS } from "../Actions";

const Editor = ({ socketRef, roomId, onCodeChange }) => {
    const editorRef = useRef(null);
    const outputRef = useRef(null);
    const [output, setOutput] = useState("");

    useEffect(() => {
        // Initialize CodeMirror editor
        if (!editorRef.current) return;

        editorRef.current = Codemirror.fromTextArea(editorRef.current, {
            mode: { name: "javascript", json: true }, // Set editor mode to JavaScript
            theme: "darcula", // Set editor theme
            autoCloseTags: true, // Enable auto closing of HTML tags
            autoCloseBrackets: true, // Enable auto closing of brackets
            lineNumbers: true, // Show line numbers
            extraKeys: {
                "Ctrl-Space": "autocomplete", // Enable autocomplete on Ctrl+Space
            },
        });

        // Handle code change in the editor
        editorRef.current.on("change", (instance, changes) => {
            const { origin } = changes;
            const code = instance.getValue();
            onCodeChange(code);
            if (origin !== "setValue") {
                // Emit code change event to the server
                socketRef.current.emit(ACTIONS.CODE_CHANGE, {
                    roomId,
                    code,
                });
            }
        });

        return () => {
            // Cleanup CodeMirror instance
            if (editorRef.current) {
                editorRef.current.toTextArea();
            }
        };
    }, []);

    useEffect(() => {
        if (socketRef.current) {
            // Listen for code change events from the server
            socketRef.current.on(ACTIONS.CODE_CHANGE, ({ code }) => {
                if (code !== null) {
                    // Update the editor with the received code
                    editorRef.current.setValue(code);
                }
            });
        }

        return () => {
            if (socketRef.current) {
                // Unsubscribe from code change events when the component unmounts
                socketRef.current.off(ACTIONS.CODE_CHANGE);
            }
        };
    }, [socketRef.current]);

    const handleRunClick = () => {
        const code = editorRef.current.getValue();
        try {
            // Clear previous output
            setOutput("");

            // Capture console.log output
            const logs = [];
            const originalConsoleLog = console.log;
            console.log = (...args) => {
                logs.push(...args);
                originalConsoleLog(...args);
            };

            // Execute the code using the Function constructor
            const executeCode = new Function(code);
            executeCode();

            // Display the captured console.log output in the output screen
            const output = logs.join("\n");
            setOutput(output);
            outputRef.current.value = output;
        } catch (error) {
            // Display any error in the output screen
            setOutput(error.toString());
            outputRef.current.value = error.toString();
        }
    };

    return (
        <div>
            <div className="btnAndHeading">
                {/* Button to run the code */}
                <button
                    className="runBtn"
                    onClick={handleRunClick}
                >
                    <i className="fas fa-play"></i> Run
                </button>
                {/* Heading */}
                <h4>Currently the editor supports only Javascript.</h4>
            </div>
            <div>
                {/* Code editor textarea */}
                <textarea
                    ref={editorRef}
                    id="realtimeEditor"
                ></textarea>
            </div>
            <div>
                {/* Output textarea */}
                <textarea
                    ref={outputRef}
                    id="output"
                    readOnly
                    placeholder="Here you will see the output"
                ></textarea>
            </div>
        </div>
    );
};

export default Editor;
