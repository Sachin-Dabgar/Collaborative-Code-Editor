import React, { useEffect, useRef, useState } from "react";
import Client from "../components/Client";
import Editor from "../components/Editor";
import { initSocket } from "../socket";
import { ACTIONS } from "../Actions";
import axios from "axios";
import {
    Navigate,
    useLocation,
    useNavigate,
    useParams,
} from "react-router-dom";
import { toast } from "react-hot-toast";

const EditorPage = () => {
    const navigate = useNavigate(); // React Router hook for navigation
    const socketRef = useRef(null); // Reference to the Socket.IO connection
    const location = useLocation(); // Current location in the React Router
    const { roomId } = useParams(); // Get the room ID from the URL parameters
    const codeRef = useRef(null); // Reference to the code editor's content
    const [clients, setClients] = useState([]); // State to store connected clients in the room

    useEffect(() => {
        // Function to initialize the Socket.IO connection
        const init = async () => {
            try {
                socketRef.current = await initSocket(); // Initialize the Socket.IO connection and store the reference
                console.log(socketRef.current);
                socketRef.current.on("connect_error", (err) =>
                    handleErrors(err)
                ); // Event handler for connection errors
                socketRef.current.on("connect_failed", (err) =>
                    handleErrors(err)
                ); // Event handler for connection failures

                function handleErrors(err) {
                    // Handle socket connection errors
                    console.log("socket error: " + err);
                    toast.error("Socket connection failed, try after sometime");
                    navigate("/"); // Navigate back to the home page
                }

                console.log(socketRef.current);
                socketRef.current.emit(ACTIONS.JOIN, {
                    roomId,
                    username: location.state?.username,
                }); // Emit a "JOIN" event to join the specified room with the username

                // Event listener for the "JOINED" event
                socketRef.current.on(
                    ACTIONS.JOINED,
                    ({ clients, username, socketId }) => {
                        // Notify other clients in the room about the newly joined client
                        if (username !== location.state.username) {
                            toast.success(`${username} joined the room`);
                        }
                        setClients(clients); // Update the list of connected clients
                        socketRef.current.emit(ACTIONS.SYNC_CODE, {
                            code: codeRef.current,
                            socketId,
                        }); // Emit a "SYNC_CODE" event to sync the code with the newly joined client
                    }
                );

                // Event listener for the "DISCONNECTED" event
                socketRef.current.on(
                    ACTIONS.DISCONNECTED,
                    ({ socketId, username }) => {
                        toast.success(`${username} left the room`); // Notify when a client disconnects from the room
                        setClients((prev) => {
                            return prev.filter(
                                (client) => client.socketId !== socketId
                            ); // Update the list of connected clients after a client disconnects
                        });
                    }
                );
            } catch (error) {
                console.log(error);
                toast.error("Socket connection error");
            }
        };
        init();

        return () => {
            // Clean-up function
            if (socketRef.current) {
                socketRef?.current.disconnect(); // Disconnect the Socket.IO connection
                socketRef.current.off(ACTIONS.JOINED); // Remove the event listener for "JOINED" event
                socketRef.current.off(ACTIONS.DISCONNECTED); // Remove the event listener for "DISCONNECTED" event
            }
        };
    }, []);

    async function copyRoomId() {
        // Function to copy the room ID to the clipboard
        try {
            await navigator.clipboard.writeText(roomId);
            toast.success("Room id copied successfully");
        } catch (err) {
            toast.error("Error while copying room id");
        }
    }

    function leaveRoom() {
        // Function to navigate back to the home page
        navigate("/");
    }

    if (!location.state) return <Navigate to={"/"} />; // Redirect to the home page if no username is provided

    return (
        <div className="mainWrap">
            <div className="aside">
                <div className="asideInner">
                    <div className="logo">
                        <h2>Happy Coding</h2>
                    </div>
                    <div className="horizontalLine"></div>
                    <h3>Connected</h3>
                    <div className="clientsList">
                        {clients.map((currentClient) => (
                            <Client
                                key={currentClient.socketId}
                                username={currentClient.username}
                            />
                        ))}
                    </div>
                </div>
                {/* buttons */}
                <button
                    className="btn copyBtn"
                    onClick={copyRoomId}
                >
                    Copy ROOM ID
                </button>
                <button
                    className="btn leaveBtn"
                    onClick={leaveRoom}
                >
                    Leave
                </button>
            </div>
            {/* text editor */}
            <div className="editorWrap">
                <Editor
                    socketRef={socketRef}
                    roomId={roomId}
                    onCodeChange={(code) => (codeRef.current = code)}
                />
            </div>
        </div>
    );
};

export default EditorPage;
