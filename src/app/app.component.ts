import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import AgoraRTC, { IAgoraRTCClient, IAgoraRTCRemoteUser, ICameraVideoTrack, IMicrophoneAudioTrack } from 'agora-rtc-sdk-ng';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit {



  // Dynamically create a container in the form of a DIV element to play the remote video track.
  remotePlayerContainer:HTMLElement
  // Dynamically create a container in the form of a DIV element to play the local video track.
  // @ViewChild('localPlayerContainer') localPlayerContainer: any;
  localPlayerContainer:HTMLElement




  agoraEngine: IAgoraRTCClient;
  channelParameters: {
    // A variable to hold a local audio track.
    localAudioTrack?: IMicrophoneAudioTrack,
    // A variable to hold a local video track.
    localVideoTrack?: ICameraVideoTrack,
    // A variable to hold a remote audio track.
    remoteAudioTrack?: IMicrophoneAudioTrack,
    // A variable to hold a remote video track.
    remoteVideoTrack?: ICameraVideoTrack,
    // A variable to hold the remote user id.s
    remoteUid?: string,
  } = {};

  constructor() {

  }

  ngOnInit(): void {
    this.checkCameraAvailability();
  }

  ngAfterViewInit(): void {

      // Dynamically create a container in the form of a DIV element to play the remote video track.
  this.remotePlayerContainer = document.getElementById("remote-player-container");
  // Dynamically create a container in the form of a DIV element to play the local video track.
  // @ViewChild('localPlayerContainer') localPlayerContainer: any;
  this.localPlayerContainer = document.getElementById('local-player-container');

    this.agoraEngine = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp9' });
    // Specify the ID of the DIV container. You can use the uid of the local user.
    this.localPlayerContainer.id = 'user-id';
    // Set the textContent property of the local video container to the local user id.
    this.localPlayerContainer.textContent = "Local user";
    // Set the local video container size.

    // Display channel name
    document.getElementById("channelName").innerHTML = 'My channel';
    // Display User name
    document.getElementById("userId").innerHTML = 'User Name Global';

    this.subscribeToEvents()
  }

  async join(userId: number) {
    await this.agoraEngine.join(
      'f6cc6f88f9ef4bd385c9e38fadf1e9e5',
      'test',
      '007eJxTYDAuqpj7uORSXuH5/e9VHl25P7nW0XmCovwP6693nBZfnOarwJBmlpxslmZhkWaZmmaSlGJsYZpsmWpskZaYkmaYaplqKtm8JbUhkJFhyV43FkYGCATxWRhKUotLGBgAQ4Ei3g==',
      `user-${userId}`
    );
    // Create a local audio track from the audio sampled by a microphone.
    this.channelParameters.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
    // Create a local video track from the video captured by a camera.
    this.channelParameters.localVideoTrack = await AgoraRTC.createCameraVideoTrack();
    // Append the local video container to the page body.
    document.body.append(this.localPlayerContainer);
    // Publish the local audio and video tracks in the channel.
    await this.agoraEngine.publish([
      this.channelParameters.localAudioTrack,
      this.channelParameters.localVideoTrack,
    ]);
    // Play the local video track.
    console.log("local player container is ",this.localPlayerContainer)
    this.channelParameters.localVideoTrack.play(this.localPlayerContainer,{fit:'cover'});

  };

  async checkCameraAvailability() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Camera is available, you can proceed with video call implementation
      console.log(" Camera is available ");
      // Don't forget to stop the stream if you don't need it anymore
      stream.getTracks().forEach(track => track.stop());
    } catch (error: any) {
      // Handle the error when camera is not accessible
      if (error.name === 'NotAllowedError' || error.name === 'NotFoundError') {
        console.error('Camera not accessible or not found.', error);
        // You can provide a user-friendly message or take appropriate actions here
      } else {
        console.error('Error accessing camera:', error);
        // Handle other errors as needed
      }
    }
  }


  subscribeToEvents() {
    // Event Listeners
    this.agoraEngine.on("user-published", async (user, mediaType) => {
      // Subscribe to the remote user when the SDK triggers the "user-published" event.
      await this.agoraEngine.subscribe(user, mediaType);
      console.log("subscribe success");
      this.handleVSDKEvents("user-published", user, mediaType);
    });

    // Listen for the "user-unpublished" event.
    this.agoraEngine.on("user-unpublished", (user) => {
      console.log(user.uid + "has left the channel");
    });

  }

  muteOrUnmuteAudio() {
    if (this.channelParameters.localAudioTrack.muted) {
      this.channelParameters.localAudioTrack.setMuted(false);
    } else {
      this.channelParameters.localAudioTrack.setMuted(true);
    }
  }

  turnCameraOnOrOff() {
    if (this.channelParameters.localVideoTrack.enabled) {
      this.channelParameters.localVideoTrack.setEnabled(false);
    } else {
      this.channelParameters.localVideoTrack.setEnabled(true);
    }
  }


  handleVSDKEvents = (eventName: string, ...args: any) => {
    switch (eventName) {
      case "user-published":
        //here agrs[1] = mediaType:'audio' | 'video' | 'datachannel'
        if (args[1] == "video") {
          // Retrieve the remote video track.
          this.channelParameters.remoteVideoTrack = args[0].videoTrack;
          // Retrieve the remote audio track.
          this.channelParameters.remoteAudioTrack = args[0].audioTrack;
          // Save the remote user id for reuse.
          this.channelParameters.remoteUid = args[0].uid.toString();
          // Specify the ID of the DIV container. You can use the uid of the remote user.
          this.remotePlayerContainer.id = args[0].uid.toString();
          this.channelParameters.remoteUid = args[0].uid.toString();
          this.remotePlayerContainer.textContent =
            "Remote user " + args[0].uid.toString();
          // Append the remote container to the page body.
          document.body.append(this.remotePlayerContainer);
          // Play the remote video track.
          this.channelParameters.remoteVideoTrack.play(this.remotePlayerContainer);
        }
        // Subscribe and play the remote audio track If the remote user publishes the audio track only.
        if (args[1] == "audio") {
          // Get the RemoteAudioTrack object in the AgoraRTCRemoteUser object.
          this.channelParameters.remoteAudioTrack = args[0].audioTrack;
          // Play the remote audio track. No need to pass any DOM element.
          this.channelParameters.remoteAudioTrack.play();
        }
    }
  };

  async leave() {
    // Destroy the local audio and video tracks.
    this.channelParameters.localAudioTrack.close();
    this.channelParameters.localVideoTrack.close();
    // Remove the containers you created for the local video and remote video.
    await this.agoraEngine.leave();
  };
}
