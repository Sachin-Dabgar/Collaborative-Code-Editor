import React, { useState } from "react";
import { v4 as uuid } from "uuid";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const Home = () => {
    const navigate = useNavigate();

    const [roomId, setRoomId] = useState("");
    const [username, setUsername] = useState("");

    function createNewRoom(e) {
        e.preventDefault();
        const id = uuid();
        setRoomId(id);
        toast.success("Created new room");
    }

    function joinRoom() {
        if (!roomId || !username) {
            toast.error("Room ID and Username is required");
            return;
        }
        // redirect
        navigate(`/editor/${roomId}`, {
            state: {
                username,
            },
        });
    }

    function handleInputEnter(e) {
        if (e.code === "Enter") {
            joinRoom();
        }
    }

    return (
        <div className="homePageWrapper">
            <div className="formWrapper">
                <h1>Edit With Friends</h1>
                <h4 className="mainLabel">Paste invitation ROOM ID</h4>
                <div className="inputGroup">
                    <input
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                        type="text"
                        className="inputBox"
                        placeholder="ROOM ID"
                        onKeyUp={handleInputEnter}
                    />
                    <input
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        type="text"
                        className="inputBox"
                        placeholder="USERNAME"
                        onKeyUp={handleInputEnter}
                    />
                    <button
                        className="btn joinBtn"
                        onClick={joinRoom}
                    >
                        Join
                    </button>
                    <span className="createInfo">
                        If you don't have an invite then create
                        <button
                            className="createNewBtn"
                            onClick={createNewRoom}
                        >
                            new room
                        </button>
                    </span>
                </div>
            </div>
            <footer>
                <h4>
                    Built with ❤️ by <span>Sachin Dabgar</span>
                </h4>
            </footer>
        </div>
    );
};

export default Home;
