import Janus from './janus.es.js';

class JanusHelper { 
    janusSession = null;
    janusPlugins = {
        "publisher": null,
        "subscribers": []
    };

    init = () => {
        Janus.init({
            debug: true,
            // eslint-disable-next-line react-hooks/rules-of-hooks
            dependencies: Janus.useDefaultDependencies(), // or: Janus.useOldDependencies() to get the behaviour of previous Janus versions
            callback: function() {
                // Janus initialized!
            }
        });
    }

    createSession = () => {
        if(!this.janusSession) {
            Janus.init();
        }
            
        this.janusSession = new Janus({
            server: ['ws://localhost:8188/','http://localhost:8088/janus'],
            success: function() {
                return this.janusSession;
            },
            error: function(cause) {
                Janus.error(cause);
                /*bootbox.alert(error, function() {
                    window.location.reload();
                });*/
            },
            destroyed: function() {
                // window.location.reload();
            }
        });

        
    }

    initVideoRoomPlugin = () => {
        this.janusSession.attach(
            {
                plugin: "janus.plugin.videoroom",
                //opaqueId: opaqueId,
                success: function(pluginHandle) {
                    this.janusPlugins["publisher"] = pluginHandle;
                },
                error: function(error) {
                    
                },
                consentDialog: function(on) {
                    
                },
                iceState: function(state) {
                    
                },
                mediaState: function(medium, on) {
                    
                },
                webrtcState: function(on) {
                    
                },
                onmessage: function(msg, jsep) {
                    
                },
                onlocalstream: function(stream) {
                    
                },
                onremotestream: function(stream) {
                    // The publisher stream is sendonly, we don't expect anything here
                },
                ondataopen: function(data) {

                },
                ondata: function(data) {

                },
                oncleanup: function() {
                    
                }
            }
        );
    }

    joinRoomAsPublisher = () => {
        let 
    }
    
    // initVideoCallPlugin = () => {
    //     this.janusSession.attach({
    //         plugin: "janus.plugin.videocall",
    //         success: function(pluginHandle) {
    //             videocall = pluginHandle;
    //             Janus.log("Plugin attached! (" + videocall.getPlugin() + ", id=" + videocall.getId() + ")");
    //             // Prepare the username registration
    //             $('#videocall').removeClass('hide').show();
    //             $('#login').removeClass('hide').show();
    //             $('#registernow').removeClass('hide').show();
    //             $('#register').click(registerUsername);
    //             $('#username').focus();
    //             $('#start').removeAttr('disabled').html("Stop")
    //                 .click(function() {
    //                     $(this).attr('disabled', true);
    //                     janus.destroy();
    //                 });
    //         },
    //         error: function(error) {
    //             Janus.error("  -- Error attaching plugin...", error);
    //             bootbox.alert("  -- Error attaching plugin... " + error);
    //         },
    //         consentDialog: function(on) {
    //             Janus.debug("Consent dialog should be " + (on ? "on" : "off") + " now");
    //             if(on) {
    //                 // Darken screen and show hint
    //                 $.blockUI({
    //                     message: '<div><img src="up_arrow.png"/></div>',
    //                     css: {
    //                         border: 'none',
    //                         padding: '15px',
    //                         backgroundColor: 'transparent',
    //                         color: '#aaa',
    //                         top: '10px',
    //                         left: (navigator.mozGetUserMedia ? '-100px' : '300px')
    //                     } });
    //             } else {
    //                 // Restore screen
    //                 $.unblockUI();
    //             }
    //         },
    //         iceState: function(state) {
    //             Janus.log("ICE state changed to " + state);
    //         },
    //         mediaState: function(medium, on) {
    //             Janus.log("Janus " + (on ? "started" : "stopped") + " receiving our " + medium);
    //         },
    //         webrtcState: function(on) {
    //             Janus.log("Janus says our WebRTC PeerConnection is " + (on ? "up" : "down") + " now");
    //             $("#videoleft").parent().unblock();
    //         },
    //         onmessage: function(msg, jsep) {
    //             Janus.debug(" ::: Got a message :::", msg);
    //             var result = msg["result"];
    //             if(result) {
    //                 if(result["list"]) {
    //                     var list = result["list"];
    //                     Janus.debug("Got a list of registered peers:", list);
    //                     for(var mp in list) {
    //                         Janus.debug("  >> [" + list[mp] + "]");
    //                     }
    //                 } else if(result["event"]) {
    //                     var event = result["event"];
    //                     if(event === 'registered') {
    //                         myusername = result["username"];
    //                         Janus.log("Successfully registered as " + myusername + "!");
    //                         $('#youok').removeClass('hide').show().html("Registered as '" + myusername + "'");
    //                         // Get a list of available peers, just for fun
    //                         videocall.send({ message: { request: "list" }});
    //                         // Enable buttons to call now
    //                         $('#phone').removeClass('hide').show();
    //                         $('#call').unbind('click').click(doCall);
    //                         $('#peer').focus();
    //                     } else if(event === 'calling') {
    //                         Janus.log("Waiting for the peer to answer...");
    //                         // TODO Any ringtone?
    //                         bootbox.alert("Waiting for the peer to answer...");
    //                     } else if(event === 'incomingcall') {
    //                         Janus.log("Incoming call from " + result["username"] + "!");
    //                         yourusername = result["username"];
    //                         // Notify user
    //                         bootbox.hideAll();
    //                         incoming = bootbox.dialog({
    //                             message: "Incoming call from " + yourusername + "!",
    //                             title: "Incoming call",
    //                             closeButton: false,
    //                             buttons: {
    //                                 success: {
    //                                     label: "Answer",
    //                                     className: "btn-success",
    //                                     callback: function() {
    //                                         incoming = null;
    //                                         $('#peer').val(result["username"]).attr('disabled', true);
    //                                         videocall.createAnswer(
    //                                             {
    //                                                 jsep: jsep,
    //                                                 // No media provided: by default, it's sendrecv for audio and video
    //                                                 media: { data: true },	// Let's negotiate data channels as well
    //                                                 // If you want to test simulcasting (Chrome and Firefox only), then
    //                                                 // pass a ?simulcast=true when opening this demo page: it will turn
    //                                                 // the following 'simulcast' property to pass to janus.js to true
    //                                                 simulcast: doSimulcast,
    //                                                 success: function(jsep) {
    //                                                     Janus.debug("Got SDP!", jsep);
    //                                                     var body = { request: "accept" };
    //                                                     videocall.send({ message: body, jsep: jsep });
    //                                                     $('#peer').attr('disabled', true);
    //                                                     $('#call').removeAttr('disabled').html('Hangup')
    //                                                         .removeClass("btn-success").addClass("btn-danger")
    //                                                         .unbind('click').click(doHangup);
    //                                                 },
    //                                                 error: function(error) {
    //                                                     Janus.error("WebRTC error:", error);
    //                                                     bootbox.alert("WebRTC error... " + error.message);
    //                                                 }
    //                                             });
    //                                     }
    //                                 },
    //                                 danger: {
    //                                     label: "Decline",
    //                                     className: "btn-danger",
    //                                     callback: function() {
    //                                         doHangup();
    //                                     }
    //                                 }
    //                             }
    //                         });
    //                     } else if(event === 'accepted') {
    //                         bootbox.hideAll();
    //                         var peer = result["username"];
    //                         if(!peer) {
    //                             Janus.log("Call started!");
    //                         } else {
    //                             Janus.log(peer + " accepted the call!");
    //                             yourusername = peer;
    //                         }
    //                         // Video call can start
    //                         if(jsep)
    //                             videocall.handleRemoteJsep({ jsep: jsep });
    //                         $('#call').removeAttr('disabled').html('Hangup')
    //                             .removeClass("btn-success").addClass("btn-danger")
    //                             .unbind('click').click(doHangup);
    //                     } else if(event === 'update') {
    //                         // An 'update' event may be used to provide renegotiation attempts
    //                         if(jsep) {
    //                             if(jsep.type === "answer") {
    //                                 videocall.handleRemoteJsep({ jsep: jsep });
    //                             } else {
    //                                 videocall.createAnswer(
    //                                     {
    //                                         jsep: jsep,
    //                                         media: { data: true },	// Let's negotiate data channels as well
    //                                         success: function(jsep) {
    //                                             Janus.debug("Got SDP!", jsep);
    //                                             var body = { request: "set" };
    //                                             videocall.send({ message: body, jsep: jsep });
    //                                         },
    //                                         error: function(error) {
    //                                             Janus.error("WebRTC error:", error);
    //                                             bootbox.alert("WebRTC error... " + error.message);
    //                                         }
    //                                     });
    //                             }
    //                         }
    //                     } else if(event === 'hangup') {
    //                         Janus.log("Call hung up by " + result["username"] + " (" + result["reason"] + ")!");
    //                         // Reset status
    //                         bootbox.hideAll();
    //                         videocall.hangup();
    //                         if(spinner)
    //                             spinner.stop();
    //                         $('#waitingvideo').remove();
    //                         $('#videos').hide();
    //                         $('#peer').removeAttr('disabled').val('');
    //                         $('#call').removeAttr('disabled').html('Call')
    //                             .removeClass("btn-danger").addClass("btn-success")
    //                             .unbind('click').click(doCall);
    //                         $('#toggleaudio').attr('disabled', true);
    //                         $('#togglevideo').attr('disabled', true);
    //                         $('#bitrate').attr('disabled', true);
    //                         $('#curbitrate').hide();
    //                         $('#curres').hide();
    //                     } else if(event === "simulcast") {
    //                         // Is simulcast in place?
    //                         var substream = result["substream"];
    //                         var temporal = result["temporal"];
    //                         if((substream !== null && substream !== undefined) || (temporal !== null && temporal !== undefined)) {
    //                             if(!simulcastStarted) {
    //                                 simulcastStarted = true;
    //                                 addSimulcastButtons(result["videocodec"] === "vp8" || result["videocodec"] === "h264");
    //                             }
    //                             // We just received notice that there's been a switch, update the buttons
    //                             updateSimulcastButtons(substream, temporal);
    //                         }
    //                     }
    //                 }
    //             } else {
    //                 // FIXME Error?
    //                 var error = msg["error"];
    //                 bootbox.alert(error);
    //                 if(error.indexOf("already taken") > 0) {
    //                     // FIXME Use status codes...
    //                     $('#username').removeAttr('disabled').val("");
    //                     $('#register').removeAttr('disabled').unbind('click').click(registerUsername);
    //                 }
    //                 // TODO Reset status
    //                 videocall.hangup();
    //                 if(spinner)
    //                     spinner.stop();
    //                 $('#waitingvideo').remove();
    //                 $('#videos').hide();
    //                 $('#peer').removeAttr('disabled').val('');
    //                 $('#call').removeAttr('disabled').html('Call')
    //                     .removeClass("btn-danger").addClass("btn-success")
    //                     .unbind('click').click(doCall);
    //                 $('#toggleaudio').attr('disabled', true);
    //                 $('#togglevideo').attr('disabled', true);
    //                 $('#bitrate').attr('disabled', true);
    //                 $('#curbitrate').hide();
    //                 $('#curres').hide();
    //                 if(bitrateTimer)
    //                     clearInterval(bitrateTimer);
    //                 bitrateTimer = null;
    //             }
    //         },
    //         onlocalstream: function(stream) {
    //             Janus.debug(" ::: Got a local stream :::", stream);
    //             $('#videos').removeClass('hide').show();
    //             if($('#myvideo').length === 0)
    //                 $('#videoleft').append('<video class="rounded centered" id="myvideo" width="100%" height="100%" autoplay playsinline muted="muted"/>');
    //             Janus.attachMediaStream($('#myvideo').get(0), stream);
    //             $("#myvideo").get(0).muted = "muted";
    //             if(videocall.webrtcStuff.pc.iceConnectionState !== "completed" &&
    //                     videocall.webrtcStuff.pc.iceConnectionState !== "connected") {
    //                 $("#videoleft").parent().block({
    //                     message: '<b>Publishing...</b>',
    //                     css: {
    //                         border: 'none',
    //                         backgroundColor: 'transparent',
    //                         color: 'white'
    //                     }
    //                 });
    //                 // No remote video yet
    //                 $('#videoright').append('<video class="rounded centered" id="waitingvideo" width="100%" height="100%" />');
    //                 if(spinner == null) {
    //                     var target = document.getElementById('videoright');
    //                     spinner = new Spinner({top:100}).spin(target);
    //                 } else {
    //                     spinner.spin();
    //                 }
    //             }
    //             var videoTracks = stream.getVideoTracks();
    //             if(!videoTracks || videoTracks.length === 0) {
    //                 // No webcam
    //                 $('#myvideo').hide();
    //                 if($('#videoleft .no-video-container').length === 0) {
    //                     $('#videoleft').append(
    //                         '<div class="no-video-container">' +
    //                             '<i class="fa fa-video-camera fa-5 no-video-icon"></i>' +
    //                             '<span class="no-video-text">No webcam available</span>' +
    //                         '</div>');
    //                 }
    //             } else {
    //                 $('#videoleft .no-video-container').remove();
    //                 $('#myvideo').removeClass('hide').show();
    //             }
    //         },
    //         onremotestream: function(stream) {
    //             Janus.debug(" ::: Got a remote stream :::", stream);
    //             var addButtons = false;
    //             if($('#remotevideo').length === 0) {
    //                 addButtons = true;
    //                 $('#videoright').append('<video class="rounded centered hide" id="remotevideo" width="100%" height="100%" autoplay playsinline/>');
    //                 // Show the video, hide the spinner and show the resolution when we get a playing event
    //                 $("#remotevideo").bind("playing", function () {
    //                     $('#waitingvideo').remove();
    //                     if(this.videoWidth)
    //                         $('#remotevideo').removeClass('hide').show();
    //                     if(spinner)
    //                         spinner.stop();
    //                     spinner = null;
    //                     var width = this.videoWidth;
    //                     var height = this.videoHeight;
    //                     $('#curres').removeClass('hide').text(width+'x'+height).show();
    //                 });
    //                 $('#callee').removeClass('hide').html(yourusername).show();
    //             }
    //             Janus.attachMediaStream($('#remotevideo').get(0), stream);
    //             var videoTracks = stream.getVideoTracks();
    //             if(!videoTracks || videoTracks.length === 0) {
    //                 // No remote video
    //                 $('#remotevideo').hide();
    //                 if($('#videoright .no-video-container').length === 0) {
    //                     $('#videoright').append(
    //                         '<div class="no-video-container">' +
    //                             '<i class="fa fa-video-camera fa-5 no-video-icon"></i>' +
    //                             '<span class="no-video-text">No remote video available</span>' +
    //                         '</div>');
    //                 }
    //             } else {
    //                 $('#videoright .no-video-container').remove();
    //                 $('#remotevideo').removeClass('hide').show();
    //             }
    //             if(!addButtons)
    //                 return;
    //             // Enable audio/video buttons and bitrate limiter
    //             audioenabled = true;
    //             videoenabled = true;
    //             $('#toggleaudio').html("Disable audio").removeClass("btn-success").addClass("btn-danger")
    //                     .unbind('click').removeAttr('disabled').click(
    //                 function() {
    //                     audioenabled = !audioenabled;
    //                     if(audioenabled)
    //                         $('#toggleaudio').html("Disable audio").removeClass("btn-success").addClass("btn-danger");
    //                     else
    //                         $('#toggleaudio').html("Enable audio").removeClass("btn-danger").addClass("btn-success");
    //                     videocall.send({ message: { request: "set", audio: audioenabled }});
    //                 });
    //             $('#togglevideo').html("Disable video").removeClass("btn-success").addClass("btn-danger")
    //                     .unbind('click').removeAttr('disabled').click(
    //                 function() {
    //                     videoenabled = !videoenabled;
    //                     if(videoenabled)
    //                         $('#togglevideo').html("Disable video").removeClass("btn-success").addClass("btn-danger");
    //                     else
    //                         $('#togglevideo').html("Enable video").removeClass("btn-danger").addClass("btn-success");
    //                     videocall.send({ message: { request: "set", video: videoenabled }});
    //                 });
    //             $('#toggleaudio').parent().removeClass('hide').show();
    //             $('#bitrateset').html("Bandwidth");
    //             $('#bitrate a').unbind('click').removeAttr('disabled').click(function() {
    //                 var id = $(this).attr("id");
    //                 var bitrate = parseInt(id)*1000;
    //                 if(bitrate === 0) {
    //                     Janus.log("Not limiting bandwidth via REMB");
    //                 } else {
    //                     Janus.log("Capping bandwidth to " + bitrate + " via REMB");
    //                 }
    //                 $('#bitrateset').html($(this).html()).parent().removeClass('open');
    //                 videocall.send({ message: { request: "set", bitrate: bitrate }});
    //                 return false;
    //             });
    //             if(Janus.webRTCAdapter.browserDetails.browser === "chrome" || Janus.webRTCAdapter.browserDetails.browser === "firefox" ||
    //                     Janus.webRTCAdapter.browserDetails.browser === "safari") {
    //                 $('#curbitrate').removeClass('hide').show();
    //                 bitrateTimer = setInterval(function() {
    //                     // Display updated bitrate, if supported
    //                     var bitrate = videocall.getBitrate();
    //                     $('#curbitrate').text(bitrate);
    //                     // Check if the resolution changed too
    //                     var width = $("#remotevideo").get(0).videoWidth;
    //                     var height = $("#remotevideo").get(0).videoHeight;
    //                     if(width > 0 && height > 0)
    //                         $('#curres').removeClass('hide').text(width+'x'+height).show();
    //                 }, 1000);
    //             }
    //         },
    //         ondataopen: function(data) {
    //             Janus.log("The DataChannel is available!");
    //             $('#videos').removeClass('hide').show();
    //             $('#datasend').removeAttr('disabled');
    //         },
    //         ondata: function(data) {
    //             Janus.debug("We got data from the DataChannel!", data);
    //             $('#datarecv').val(data);
    //         },
    //         oncleanup: function() {
    //             Janus.log(" ::: Got a cleanup notification :::");
    //             $('#myvideo').remove();
    //             $('#remotevideo').remove();
    //             $("#videoleft").parent().unblock();
    //             $('.no-video-container').remove();
    //             $('#callee').empty().hide();
    //             yourusername = null;
    //             $('#curbitrate').hide();
    //             $('#curres').hide();
    //             $('#videos').hide();
    //             $('#toggleaudio').attr('disabled', true);
    //             $('#togglevideo').attr('disabled', true);
    //             $('#bitrate').attr('disabled', true);
    //             $('#curbitrate').hide();
    //             $('#curres').hide();
    //             if(bitrateTimer)
    //                 clearInterval(bitrateTimer);
    //             bitrateTimer = null;
    //             $('#waitingvideo').remove();
    //             $('#videos').hide();
    //             simulcastStarted = false;
    //             $('#simulcast').remove();
    //             $('#peer').removeAttr('disabled').val('');
    //             $('#call').removeAttr('disabled').html('Call')
    //                 .removeClass("btn-danger").addClass("btn-success")
    //                 .unbind('click').click(doCall);
    //         }
    //     });
    // }
}

export default JanusHelper;

