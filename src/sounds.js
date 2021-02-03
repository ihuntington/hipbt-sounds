import qs from 'query-string';

export class Sounds {
    _frame = null;

    constructor() {
        console.log('HIPBT - Init', new Date());
        this.timer = null;
        this.currentTime = null;
        this.minuteTimer = null;

        // TODO: if on demand the take first track from preloaded state
        this.currentTrack = null;
        this.seeking = false;

        this.tracklist = new Map();

        // Thinking: perhaps could check to see if the page has a player
        // and then find out the programme and look that up. Also check for
        // preloaded state too.

        // Could be over thinking and keep it simple initally for the two
        // entry points there are below. Do there even need to be two and
        // return early if the pathname does not contain either.

        // if (window.location.pathname.includes('/sounds/play/live:')) {
        //     this.setupLive();
        // }

        // if (window.location.pathname.includes('/sounds/play/')) {
        //     this.setupOnDemand();
        // }

        if (!this.player) {
            console.log('HIPBT - Player - No embedded player found');
            return this;
        }

        // TODO: commented out during testing temporarily
        // this.setup();

        // TODO - this makes no sense, if it's live then there is a station
        // / if there is player then it is a station - stoopid
        // if (this._player.player.sonar.isLive) {
        //     this._station = stations.find((s) => window.location.pathname.includes(s));

        //     if (!this._station) {
        //         console.log('HIPBT - Station - No station found');
                // TODO - check to see if playing... if not playing then
                // don't quite and wait... set up a timer to start to check
                // if / when play starts and then what the join time is.
                // Could at this point in time start requesting tracks.
        //         return;
        //     }

        //     console.log('HIPBT - Station', this._station);
        // }
    }

    get isLive() {
        if (!this.player) {
            console.warn('hipbt: player does not exist');
        }

        return this.player.player.sonar.isLive;
    }

    // Rename this
    get preloadedTracklist() {
        const state = this.getPreloadedState();
        // TODO: Live and on demand may have different locations for tracks
        const tracks = state && state.tracks && state.tracks.data || [];

        return tracks;
    }

    // get currentTime() {
    //     if (!this.player) {
    //         console.log('HIBPT - Unable to get current time of player');
    //         return null;
    //     }

    //     return this.player.currentTime() * 1000;
    // }

    get player() {
        return this.getEmbeddedPlayer('smp-wrapper');
    }

    setup() {
        console.log('HIPBT - Setup');

        this.joinTime = this.player.currentTime() * 1000;
        this.currentTime = this.joinTime;
        // this.currentTime = this.player.currentTime() * 1000;

        const sharedEvents = ['playing', 'pause', 'seeking', 'userPlay'];
        const liveEvents = ['significanttimeupdate'];
        const onDemandEvents = ['continuousPlayChange', 'ended', 'timeupdate'];

        let events = [];

        if (this.isLive) {
            console.log('HIPBT - is live');
            events = events.concat(sharedEvents, liveEvents);

            this.startTimer();

            this.preloadedTracklist.forEach((track) => {
                this.addTrack(track);
            });

            const nowPlayingTrack = this.preloadedTracklist.find((track) => track.offset.now_playing);

            if (nowPlayingTrack) {
                this.currentLiveTrack = this.parseTrack(nowPlayingTrack);
                console.log('HIPBT - CURRENT LIVE TRACK', this.currentLiveTrack);
            }
        } else {
            console.log('HIPBT - on demand');
            events = events.concat(sharedEvents, onDemandEvents);
        }

        events.forEach((event) => {
            this.addEvent(event);
        });

        return this;
    };

    addEvent(event) {
        this.player._events[event].push(this.handleEvent.bind(this, event));

        return this;
    }

    handleEvent(eventName, event) {
        switch (eventName) {
            case 'significanttimeupdate': {
                console.log('significanttimeupdate', event);
                // console.log('HIPBT - Event - significanttimeupdate', event);
                this.handleSignificantTimeUpdate(event);
                break;
            }

            case 'timeupdate': {
                const { currentTime } = event;

                const playingTrack = this.preloadedTracklist.filter((track) => {
                    return currentTime >= track.offset.start && currentTime <= track.offset.end;
                });

                // let track = null;

                // TODO: not perfect... need a proper solution as you could seek into the overlap portion
                // if (playingTrack.length > 0) {
                //     if (currentTime < this.currentTime) {
                //         track = playingTrack.shift();
                //     } else {
                //         track = playingTrack.pop();
                //     }
                // }

                if (playingTrack.length === 0 && this.seeking) {
                    console.log('> Seeking, no playing track');
                    this.currentTrack = null;
                    this.seeking = false;
                    return;
                }

                if (playingTrack.length > 0 && this.seeking) {
                    // TODO: improve the track selection as track times can overlap
                    this.currentTrack = playingTrack.pop();
                    console.log('> Seeking, current track', this.currentTrack);
                    this.seeking = false;
                    return;
                }

                // No playing track and there is a current track then this is finished(?)
                if (playingTrack.length === 0 && this.currentTrack) {
                    console.log('> No playing track, has current track, send segment', this.currentTrack);
                    this.sendSegment(this.currentTrack);
                    this.currentTrack = null;
                    return;
                }

                if (playingTrack.length > 0 && this.currentTrack) {
                    const p = playingTrack.pop();
                    if (p.id !== this.currentTrack.id) {
                        this.sendSegment(this.currentTrack);
                        this.currentTrack = p;
                    }
                    return;
                }

                if (playingTrack.length > 0) {
                    this.currentTrack = playingTrack.pop();
                }

                this.currentTime = currentTime;

                return;
            }

            case 'seeking': {
                console.log('> seeking', event);
                this.seeking = true;
            }
        }
    };

    getEmbeddedPlayers() {
        return window.embeddedMedia.api.players();
    };

    getEmbeddedPlayer(name) {
        const players = this.getEmbeddedPlayers();

        if (players[name]) {
            return players[name];
        }

        console.warn(`HIPBT Could not find embedded player ${name}`);
    }

    getPreloadedState() {
        return window.__PRELOADED_STATE__ || {};
    };

    handleSignificantTimeUpdate(event) {
        // TODO: container can change between programmes so cannot rely on
        // preloaded state as the next would become current
        const container = this.getPreloadedState().programmes.current;
        // TODO: start may always not been in ms
        const containerStartTime = container.webcastData.accurateStartTime * 1000;
        const currentTime = event.currentTime * 1000;
        console.log('handleSignificantTimeUpdate', event);

        const playingTrack = Array.from(this.tracklist.values()).filter((track) => {
            const start = containerStartTime + (track.start * 1000);
            const end = containerStartTime + (track.end * 1000);
            console.log('start', start, 'end', end, 'current', currentTime);
            return currentTime >= start && currentTime <= end;
        });

        console.log('playingTrack', playingTrack);

        if (playingTrack.length === 0 && this.seeking) {
            console.log('> Seeking, no playing track');
            this.currentTrack = null;
            this.seeking = false;
            return;
        }

        if (playingTrack.length > 0 && this.seeking) {
            // TODO: improve the track selection as track times can overlap
            this.currentTrack = playingTrack.pop();
            console.log('> Seeking, current track', this.currentTrack);
            this.seeking = false;
            return;
        }

        // No playing track and there is a current track then this is finished(?)
        if (playingTrack.length === 0 && this.currentTrack) {
            console.log('> No playing track, has current track, send segment', this.currentTrack);
            this.sendSegment(this.currentTrack);
            this.currentTrack = null;
            return;
        }

        if (playingTrack.length > 0 && this.currentTrack) {
            const p = playingTrack.pop();
            if (p.id !== this.currentTrack.id) {
                console.log('> playing track and send it');
                this.sendSegment(this.currentTrack);
                this.currentTrack = p;
            }
            return;
        }

        if (playingTrack.length > 0) {
            console.log('> set current track as last one');
            this.currentTrack = playingTrack.pop();
        }

        this.currentTime = currentTime;

        return;
    }

    addTrack(track) {
        if (track.segment_type === "music" && !this.tracklist.has(track.id)) {
            this.tracklist.set(track.id, this.parseTrack(track));
        }
    }

    parseTrack({ id, image_url, offset, titles, urn }) {
        return {
            artist: titles.primary,
            track: titles.secondary,
            id,
            image: image_url,
            urn,
            start: offset.start,
            end: offset.end,
        };
    }

    async getLatestSegments() {
        console.log('HIPBT - GET LATEST SEGMENTS');

        try {
            const response = await fetch(URLS.SEGMENTS);
            const { data } = await response.json();

            console.log('HIPBT - GET LATEST SEGMENTS - SUCCESS');

            data.forEach((track) => this.addTrack(track));

            // TODO: this would be out of sync if seeked to a previous portion
            // possibly fine for current live track
            const nowPlayingTrack = data.find((track) => track.offset.now_playing);

            if (nowPlayingTrack) {
                this.currentLiveTrack = this.parseTrack(nowPlayingTrack);
            }
        } catch (e) {
            console.log('HIPBT - GET LATEST SEGMENTS - ERROR');
        }
    };

    sendSegment(segment) {
        console.log('> hipbt > sendSegment', segment);

        // const frame = document.createElement('iframe')
        // frame.id = 'hipbt-save'
        // frame.name = 'hipbt-save-frame'
        // frame.width = 1
        // frame.height = 1
        // frame.referrerPolicy = 'strict-origin-when-cross-origin'
        // frame.onload = (event) => {
        //     console.log('Success load iframe page', event)
        //     document.removeChild(frame)
        // }
        // frame.onerror = (event) => {
        //     console.log('Error loading iframe', event)
        //     document.removeChild(frame)
        // }

        // frame.src = `https://267989d93534.eu.ngrok.io/save?${qs.stringify(segment)}`

        // document.body.appendChild(frame);
    }

    startTimer() {
        console.log('HIPBT - START TIMER');
        this.timer  = Date.now();

        const loop = () => {
            const now = Date.now();

            if (now - this.timer >= 30 * 1000) {
                this.timer = Date.now();
                console.log('HIPBT - TIMER', this.timer);
                this.getLatestSegments();
            }
        }

        this._timerInterval = setInterval(loop, 1000);

        return this;
    };

    async fetch(segment) {
        try {
            const response = await fetch(`https://bowie.test/save?${qs.stringify(segment)}`, {
                credentials: 'include',
            });
            const data = await response.json();
            console.log('>>> data', data);
        } catch (err) {
            console.log('There was an error fetching')
        }
    }
}
