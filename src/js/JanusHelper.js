import Janus from './janus.es.js';

class JanusHelper {    
    constructor() {
        Janus.init({
            debug: true,
            // eslint-disable-next-line react-hooks/rules-of-hooks
            dependencies: Janus.useDefaultDependencies(), // or: Janus.useOldDependencies() to get the behaviour of previous Janus versions
            callback: function() {
                // Janus initialized!
                this.janusSession = this.createSession();
            }
        });
    }

    createSession = () => {
        return new Janus({
            server: ['ws://localhost:8188/','http://localhost:8088/janus'],
            success: function() {
                // Done! attach to plugin XYZ
            },
            error: function(cause) {
                // Error, can't go on...
            },
            destroyed: function() {
                // I should get rid of this
            }
        });
    }

    attachVideoRoomPlugin = (session) => {
        let videoroom = null;
        this.janusSession.attach({
            plugin: "janus.plugin.videoroom",
            success: function(pluginHandle) {
                // Save plugin handle
                this.janusPlugins["videoroom"] = pluginHandle;

                // Rename plugin handle
                videoroom = pluginHandle;

                let body = {};

                videoroom.send({"message": body});
                videoroom.createOffer({
                    // No media property provided: by default,
                    // it's sendrecv for audio and video
                    success: function(jsep) {
                        // Got our SDP! Send our OFFER to the plugin
                        videoroom.send({"message": body, "jsep": jsep});
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
                    videoroom.handleRemoteJsep({jsep: jsep});
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