import Janus from './janus.es.js';
import React from 'react';

class JanusHelper extends React.Component {    
    constructor(props) {
        super(props);
        this.state = {
            server: [],
            janus: null,
            sfutest: null,
            opaqueId: null,
            myroom: null,
            myusername: null,
            myid: null,
            mystream: null,
            mypvtid: null,
            feeds: [],
            bitrateTimer: []
        }
    }

    componentDidMount = () => {
        this.setState({
            server: ["ws://localhost:8188","http://localhost:8088/janus"],
            opaqueId: "videoroomtest-"+Janus.randomString(12),
            myroom: 1234
        });
        
        Janus.init({
            debug: true,
            // eslint-disable-next-line react-hooks/rules-of-hooks
            dependencies: Janus.useDefaultDependencies(), // or: Janus.useOldDependencies() to get the behaviour of previous Janus versions
            callback: function() {
                // Janus initialized!
                this.setState({
                    janus: this.createSession()
                });
            }
        });
    }

    createSession = () => {
        return new Janus({
            server: ['ws://localhost:8188/','http://localhost:8088/janus'],
            success: function() {
                this.attachVideoRoomPlugin();
            },
            error: function(cause) {
                // Error, can't go on...
            },
            destroyed: function() {
                // I should get rid of this
            }
        });
    }

    registerUsername = (username) => {
        let register = {
            request: "join",
            room: this.state.myroom,
            ptype: "publisher",
            display: username
        };
        this.setState({
            myusername: username
        });
        this.state.sfutest.send({ message: register });
    }

    publishOwnFeed = (useAudio) => {
        // Publish our stream
        this.state.sfutest.createOffer({
            // Add data:true here if you want to publish datachannels as well
            media: {
                audioRecv: false,
                videoRecv: false,
                audioSend: useAudio,
                videoSend: true
            },	// Publishers are sendonly
            
            success: function(jsep) {
                Janus.debug("Got publisher SDP!", jsep);
                let publish = {
                    request: "configure",
                    audio: useAudio,
                    video: true
                };

                this.state.sfutest.send({
                    message: publish,
                    jsep: jsep
                });
            },
            error: function(error) {
                Janus.error("WebRTC error:", error);
                if(useAudio) {
                    this.publishOwnFeed(false);
                } else {
                    console.error(error);
                }
            }
        });
    }

    toggleMute = () => {
        let muted = this.state.sfutest.isAudioMuted();
        Janus.log((muted ? "Unmuting" : "Muting") + " local stream...");
        if(muted)
            this.state.sfutest.unmuteAudio();
        else
            this.state.sfutest.muteAudio();
        muted = this.state.sfutest.isAudioMuted();
    }

    unpublishOwnFeed = () => {
        // Unpublish our stream
        let unpublish = {
            request: "unpublish"
        };
        
        this.state.sfutest.send({
            message: unpublish
        });
    }

    getQueryStringValue = (name) => {
        // eslint-disable-next-line no-useless-escape
        name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
        var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
            // eslint-disable-next-line no-restricted-globals
            results = regex.exec(location.search);
        return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
    }

    attachVideoRoomPlugin = (session) => {
        this.state.janus.attach({
            plugin: "janus.plugin.videoroom",
            opaqueId: this.state.opaqueId,
            success: function(pluginHandle) {
                this.setState({
                    sfutest: pluginHandle
                });
                Janus.log("Plugin attached! (" + this.state.sfutest.getPlugin() + ", id=" + this.state.sfutest.getId() + ")");
                Janus.log("  -- This is a publisher/manager");
                // Prepare the username registration
                this.registerUsername(`user-${Math.floor(1000000*Math.random())}`);
            },
            error: function(error) {
                Janus.error("  -- Error attaching plugin...", error);
            },
            consentDialog: function(on) {
                Janus.debug("Consent dialog should be " + (on ? "on" : "off") + " now");
            },
            iceState: function(state) {
                Janus.log("ICE state changed to " + state);
            },
            mediaState: function(medium, on) {
                Janus.log("Janus " + (on ? "started" : "stopped") + " receiving our " + medium);
            },
            webrtcState: function(on) {
                Janus.log("Janus says our WebRTC PeerConnection is " + (on ? "up" : "down") + " now");
                if(!on)
                    return;
            },
            onmessage: function(msg, jsep) {
                Janus.debug(" ::: Got a message (publisher) :::", msg);
                var event = msg["videoroom"];
                Janus.debug("Event: " + event);
                if(event) {
                    if(event === "joined") {
                        // Publisher/manager created, negotiate WebRTC and attach to existing feeds, if any
                        this.setState({
                            myid: msg["id"],
                            mypvtid: msg["private_id"]
                        });
                        Janus.log("Successfully joined room " + msg["room"] + " with ID " + this.state.myid);

                        this.publishOwnFeed(true);

                        // Any new feed to attach to?
                        if(msg["publishers"]) {
                            let list = msg["publishers"];
                            Janus.debug("Got a list of available publishers/feeds:", list);
                            for(let f in list) {
                                let id = list[f]["id"];
                                let display = list[f]["display"];
                                let audio = list[f]["audio_codec"];
                                let video = list[f]["video_codec"];
                                Janus.debug("  >> [" + id + "] " + display + " (audio: " + audio + ", video: " + video + ")");
                                this.newRemoteFeed(id, display, audio, video);
                            }
                        }
                    } else if(event === "destroyed") {
                        // The room has been destroyed
                        Janus.warn("The room has been destroyed!");
                    } else if(event === "event") {
                        // Any new feed to attach to?
                        if(msg["publishers"]) {
                            let list = msg["publishers"];
                            Janus.debug("Got a list of available publishers/feeds:", list);
                            for(let f in list) {
                                let id = list[f]["id"];
                                let display = list[f]["display"];
                                let audio = list[f]["audio_codec"];
                                let video = list[f]["video_codec"];
                                Janus.debug("  >> [" + id + "] " + display + " (audio: " + audio + ", video: " + video + ")");
                                this.newRemoteFeed(id, display, audio, video);
                            }
                        } else if(msg["leaving"]) {
                            // One of the publishers has gone away?
                            var leaving = msg["leaving"];
                            Janus.log("Publisher left: " + leaving);
                            var remoteFeed = null;
                            for(var i=1; i<6; i++) {
                                if(this.state.feeds[i] && this.state.feeds[i].rfid === leaving) {
                                    remoteFeed = this.state.feeds[i];
                                    break;
                                }
                            }
                            if(remoteFeed != null) {
                                Janus.debug("Feed " + remoteFeed.rfid + " (" + remoteFeed.rfdisplay + ") has left the room, detaching");
                                let remoteVideo = document.getElementById(`remote-${remoteFeed.rfindex}`);
                                remoteVideo.remove();
                                let feedsAux = this.state.feeds.concat();
                                feedsAux[remoteFeed.rfindex] = null;
                                this.setState({
                                    feeds: feedsAux
                                });
                                remoteFeed.detach();
                            }
                        } else if(msg["unpublished"]) {
                            // One of the publishers has unpublished?
                            var unpublished = msg["unpublished"];
                            Janus.log("Publisher left: " + unpublished);
                            if(unpublished === 'ok') {
                                // That's us
                                this.state.sfutest.hangup();
                                return;
                            }

                            let remoteFeed = null;
                            for(let i=1; i<6; i++) {
                                if(this.state.feeds[i] && this.state.feeds[i].rfid === unpublished) {
                                    remoteFeed = this.state.feeds[i];
                                    break;
                                }
                            }

                            if(remoteFeed != null) {
                                Janus.debug("Feed " + remoteFeed.rfid + " (" + remoteFeed.rfdisplay + ") has left the room, detaching");
                                let remoteVideo = document.getElementById(`remote-${remoteFeed.rfindex}`);
                                remoteVideo.remove();
                                let feedsAux = this.state.feeds.concat();
                                feedsAux[remoteFeed.rfindex] = null;
                                this.setState({
                                    feeds: feedsAux
                                });
                                remoteFeed.detach();
                            }
                        } else if(msg["error"]) {
                            if(msg["error_code"] === 426) {
                                // This is a "no such room" error: give a more meaningful description
                                console.error(
                                    "<p>Apparently room <code>" + this.state.myroom + "</code> (the one this demo uses as a test room) " +
                                    "does not exist...</p><p>Do you have an updated <code>janus.plugin.videoroom.jcfg</code> " +
                                    "configuration file? If not, make sure you copy the details of room <code>" + this.state.myroom + "</code> " +
                                    "from that sample in your current configuration file, then restart Janus and try again."
                                );
                            } else {
                                console.error(msg["error"]);
                            }
                        }
                    }
                }


                if(jsep) {
                    Janus.debug("Handling SDP as well...", jsep);
                    this.state.sfutest.handleRemoteJsep({
                        jsep: jsep
                    });
                }
            },
            onlocalstream: function(stream) {
                Janus.debug(" ::: Got a local stream :::", stream);
                this.setState({
                    mystream: stream
                });
                let localVideo = document.getElementById("local");
                Janus.attachMediaStream(localVideo, stream);
            },
            onremotestream: function(stream) {
                // The publisher stream is sendonly, we don't expect anything here
            },
            oncleanup: function() {
                Janus.log(" ::: Got a cleanup notification: we are unpublished now :::");
                this.setState({
                    mystream: null
                });
                let localVideo = document.getElementById("local");
                localVideo.srcObject = null;
            }
        });

    }
    
    newRemoteFeed = (id, display, audio, video) => {
        // A new feed has been published, create a new plugin handle and attach to it as a subscriber
        var remoteFeed = null;
        this.state.janus.attach(
            {
                plugin: "janus.plugin.videoroom",
                opaqueId: this.state.opaqueId,
                success: function(pluginHandle) {
                    remoteFeed = pluginHandle;
                    // remoteFeed.simulcastStarted = false;
                    Janus.log("Plugin attached! (" + remoteFeed.getPlugin() + ", id=" + remoteFeed.getId() + ")");
                    Janus.log("  -- This is a subscriber");
                    // We wait for the plugin to send us an offer
                    var subscribe = {
                        request: "join",
                        room: this.state.myroom,
                        ptype: "subscriber",
                        feed: id,
                        private_id: this.state.mypvtid
                    };

                    if(Janus.webRTCAdapter.browserDetails.browser === "safari" &&
                            (video === "vp9" || (video === "vp8" && !Janus.safariVp8))) {
                        if(video)
                            video = video.toUpperCase()
    
                        subscribe["offer_video"] = false;
                    }
                    
                    remoteFeed.videoCodec = video;
                    remoteFeed.send({
                        message: subscribe
                    });
                },
                error: function(error) {
                    Janus.error("  -- Error attaching plugin...", error);
                },
                onmessage: function(msg, jsep) {
                    Janus.debug(" ::: Got a message (subscriber) :::", msg);
                    var event = msg["videoroom"];
                    Janus.debug("Event: " + event);
                    if(msg["error"]) {
                        console.error(msg["error"]);
                    } else if(event) {
                        if(event === "attached") {
                            // Subscriber created and attached
                            for(var i=1;i<6;i++) {
                                if(!this.state.feeds[i]) {
                                    let auxFeeds = this.state.feeds;
                                    auxFeeds[i] = remoteFeed;
                                    this.setState({
                                        feeds: auxFeeds
                                    });
                                    remoteFeed.rfindex = i;
                                    break;
                                }
                            }
                            remoteFeed.rfid = msg["id"];
                            remoteFeed.rfdisplay = msg["display"];

                            Janus.log("Successfully attached to feed " + remoteFeed.rfid + " (" + remoteFeed.rfdisplay + ") in room " + msg["room"]);
                            
                        } else if(event === "event") {
                        } else {
                        }
                    }
                    if(jsep) {
                        Janus.debug("Handling SDP as well...", jsep);
                        // Answer and attach
                        remoteFeed.createAnswer({
                            jsep: jsep,
                            // Add data:true here if you want to subscribe to datachannels as well
                            // (obviously only works if the publisher offered them in the first place)
                            media: {
                                audioSend: false,
                                videoSend: false,
                                data: true
                            },	// We want recvonly audio/video, and data channel
                            success: function(jsep) {
                                Janus.debug("Got SDP!", jsep);
                                var body = {
                                    request: "start",
                                    room: this.state.myroom
                                };
                                remoteFeed.send({
                                    message: body,
                                    jsep: jsep
                                });
                            },
                            error: function(error) {
                                Janus.error("WebRTC error:", error);
                            }
                        });
                    }
                },
                iceState: function(state) {
                    Janus.log("ICE state of this WebRTC PeerConnection (feed #" + remoteFeed.rfindex + ") changed to " + state);
                },
                webrtcState: function(on) {
                    Janus.log("Janus says this WebRTC PeerConnection (feed #" + remoteFeed.rfindex + ") is " + (on ? "up" : "down") + " now");
                },
                onlocalstream: function(stream) {
                    // The subscriber stream is recvonly, we don't expect anything here
                },
                onremotestream: function(stream) {
                    Janus.debug("Remote feed #" + remoteFeed.rfindex + ", stream:", stream);
                    // var addButtons = false;
                    let remoteVideo = document.getElementById(`remote-${remoteFeed.rfindex}`)
                    if(!remoteVideo) {
                        remoteVideo = document.createElement("video");
                        remoteVideo.id = `remote-${remoteFeed.rfindex}`;
                        document.body.appendChild(remoteVideo);
                        remoteVideo.load();
                        remoteVideo.autoplay = true;
                    }
                    
                    Janus.attachMediaStream(remoteVideo, stream);
                    
                    // TO REMOVE
                    // if($('#remotevideo'+remoteFeed.rfindex).length === 0) {
                    // 	addButtons = true;
                    // 	// No remote video yet
                    // 	$('#videoremote'+remoteFeed.rfindex).append('<video class="rounded centered" id="waitingvideo' + remoteFeed.rfindex + '" width="100%" height="100%" />');
                    // 	$('#videoremote'+remoteFeed.rfindex).append('<video class="rounded centered relative hide" id="remotevideo' + remoteFeed.rfindex + '" width="100%" height="100%" autoplay playsinline/>');
                    // 	$('#videoremote'+remoteFeed.rfindex).append(
                    // 		'<span class="label label-primary hide" id="curres'+remoteFeed.rfindex+'" style="position: absolute; bottom: 0px; left: 0px; margin: 15px;"></span>' +
                    // 		'<span class="label label-info hide" id="curbitrate'+remoteFeed.rfindex+'" style="position: absolute; bottom: 0px; right: 0px; margin: 15px;"></span>');
                    // 	// Show the video, hide the spinner and show the resolution when we get a playing event
                    // 	$("#remotevideo"+remoteFeed.rfindex).bind("playing", function () {
                    // 		if(remoteFeed.spinner)
                    // 			remoteFeed.spinner.stop();
                    // 		remoteFeed.spinner = null;
                    // 		$('#waitingvideo'+remoteFeed.rfindex).remove();
                    // 		if(this.videoWidth)
                    // 			$('#remotevideo'+remoteFeed.rfindex).removeClass('hide').show();
                    // 		var width = this.videoWidth;
                    // 		var height = this.videoHeight;
                    // 		$('#curres'+remoteFeed.rfindex).removeClass('hide').text(width+'x'+height).show();
                    // 		if(Janus.webRTCAdapter.browserDetails.browser === "firefox") {
                    // 			// Firefox Stable has a bug: width and height are not immediately available after a playing
                    // 			setTimeout(function() {
                    // 				var width = $("#remotevideo"+remoteFeed.rfindex).get(0).videoWidth;
                    // 				var height = $("#remotevideo"+remoteFeed.rfindex).get(0).videoHeight;
                    // 				$('#curres'+remoteFeed.rfindex).removeClass('hide').text(width+'x'+height).show();
                    // 			}, 2000);
                    // 		}
                    // 	});
                    // }
                    // Janus.attachMediaStream($('#remotevideo'+remoteFeed.rfindex).get(0), stream);
                    // var videoTracks = stream.getVideoTracks();
                    // if(!videoTracks || videoTracks.length === 0) {
                    // 	// No remote video
                    // 	$('#remotevideo'+remoteFeed.rfindex).hide();
                    // 	if($('#videoremote'+remoteFeed.rfindex + ' .no-video-container').length === 0) {
                    // 		$('#videoremote'+remoteFeed.rfindex).append(
                    // 			'<div class="no-video-container">' +
                    // 				'<i class="fa fa-video-camera fa-5 no-video-icon"></i>' +
                    // 				'<span class="no-video-text">No remote video available</span>' +
                    // 			'</div>');
                    // 	}
                    // } else {
                    // 	$('#videoremote'+remoteFeed.rfindex+ ' .no-video-container').remove();
                    // 	$('#remotevideo'+remoteFeed.rfindex).removeClass('hide').show();
                    // }
                    // if(!addButtons)
                    // 	return;
                    // if(Janus.webRTCAdapter.browserDetails.browser === "chrome" || Janus.webRTCAdapter.browserDetails.browser === "firefox" ||
                    // 		Janus.webRTCAdapter.browserDetails.browser === "safari") {
                    // 	$('#curbitrate'+remoteFeed.rfindex).removeClass('hide').show();
                    // 	bitrateTimer[remoteFeed.rfindex] = setInterval(function() {
                    // 		// Display updated bitrate, if supported
                    // 		var bitrate = remoteFeed.getBitrate();
                    // 		$('#curbitrate'+remoteFeed.rfindex).text(bitrate);
                    // 		// Check if the resolution changed too
                    // 		var width = $("#remotevideo"+remoteFeed.rfindex).get(0).videoWidth;
                    // 		var height = $("#remotevideo"+remoteFeed.rfindex).get(0).videoHeight;
                    // 		if(width > 0 && height > 0)
                    // 			$('#curres'+remoteFeed.rfindex).removeClass('hide').text(width+'x'+height).show();
                    // 	}, 1000);
                    // }
                },
                oncleanup: function() {
                    let remoteVideo = document.getElementById(`remote-${remoteFeed.rfindex}`);
                    remoteVideo.remove();
                }
            });
    }

    attachTextRoomPlugin = (session) => {
        let textroom;
        this.janusSession.attach({
            plugin: "janus.plugin.textroom",
            success: function(pluginHandle) {
                // Save plugin handle
                this.janusPlugins["textroom"] = pluginHandle;

                // Rename plugin handle
                textroom = pluginHandle;

                var body = {};

                textroom.send({"message": body});
                textroom.createOffer({
                    // No media property provided: by default,
                    // it's sendrecv for audio and video
                    success: function(jsep) {
                        // Got our SDP! Send our OFFER to the plugin
                        textroom.send({"message": body, "jsep": jsep});
                    },
                    error: function(error) {
                        // An error occurred...
                    },
                    customizeSdp: function(jsep) {
                        // if you want to modify the original sdp, do as the following
                        // oldSdp = jsep.sdp;
                        // jsep.sdp = yourNewSdp;
                    }
                });
            },
            error: function(cause) {
                // Couldn't attach to the plugin
            },
            consentDialog: function(on) {
                // e.g., Darken the screen if on=true (getUserMedia incoming), restore it otherwise
            },
            onmessage: function(msg, jsep) {
                // We got a message/event (msg) from the plugin
                // If jsep is not null, this involves a WebRTC negotiation
                // Handle msg, if needed, and check jsep
                if(jsep !== undefined && jsep !== null) {
                    // We have the ANSWER from the plugin
                    textroom.handleRemoteJsep({jsep: jsep});
                }
            },
            onlocalstream: function(stream) {
                // We have a local stream (getUserMedia worked!) to display
            },
            onremotestream: function(stream) {
                // We have a remote stream (working PeerConnection!) to display
            },
            oncleanup: function() {
                // PeerConnection with the plugin closed, clean the UI
                // The plugin handle is still valid so we can create a new one
            },
            detached: function() {
                // Connection with the plugin closed, get rid of its features
                // The plugin handle is not valid anymore
            }
        });
    }
}

export default JanusHelper;