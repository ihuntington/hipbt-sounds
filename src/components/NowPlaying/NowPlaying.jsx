import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import { sendSegment } from "../../services";
import "./NowPlaying.css";

const { SNOWPACK_PUBLIC_BBC_URL } = import.meta.env;

export const NowPlaying = () => {
    const [artist, setArtist] = useState("");
    const [track, setTrack] = useState("");

    const handlePostMessage = async (event) => {
        if (event.origin !== SNOWPACK_PUBLIC_BBC_URL || !event.data) {
            return;
        }

        if (event.data.type === "NO_CURRENT_TRACK") {
            setArtist("");
            setTrack("");
        }

        if (event.data.type === "NOW_PLAYING") {
            setArtist(event.data.segment.titles.primary);
            setTrack(event.data.segment.titles.secondary);
        }

        if (event.data.type === "PLAYED") {
            await sendSegment(event.data);
        }
    };

    useEffect(() => {
        window.addEventListener("message", handlePostMessage, false);

        return () => {
            window.removeEventListener("message", handlePostMessage);
        };
    });

    if (!track || !artist) {
        return null;
    }

    return (
        <div className="now-playing">
            <strong>Now playing</strong>
            <div className="now-playing__track-name">
                {track}
            </div>
            <div className="now-playing__artist-name">
                {artist}
            </div>
        </div>
    );
};
