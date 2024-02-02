import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import AgoraRTC, { IAgoraRTCClient, IAgoraRTCRemoteUser, ICameraVideoTrack, IMicrophoneAudioTrack } from 'agora-rtc-sdk-ng';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit {
  @ViewChild('remotePlayerContainer', { static: false }) remotePlayerContainer!: ElementRef;
  @ViewChild('localPlayerContainer', { static: false }) localPlayerContainer!: ElementRef;

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
    localUid?: string
  } = {};

  constructor() {

  }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.agoraEngine = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp9' });
    this.subscribeToEvents()
  }

  async join(userId: number) {
    this.channelParameters.localUid = 'user-' + userId;
    await this.agoraEngine.join(
      'f6cc6f88f9ef4bd385c9e38fadf1e9e5',
      'test',
      '007eJxTYDBh+tcQzPnt6CZXbRf7e81tnZGP+sNnq211ua3y3K7qzTIFhjSz5GSzNAuLNMvUNJOkFGML02TLVGOLtMSUNMNUy1RT3Yw9qQ2BjAznNc1ZGRkgEMRnYShJLS5hYAAAfhsgWg==',
      `user-${userId}`
    );
    this.channelParameters.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
    this.channelParameters.localVideoTrack = await AgoraRTC.createCameraVideoTrack();
    await this.agoraEngine.publish([
      this.channelParameters.localAudioTrack,
      this.channelParameters.localVideoTrack,
    ]);
    // Play the local video track.
    this.channelParameters.localVideoTrack.play(this.localPlayerContainer.nativeElement);
  };



  subscribeToEvents() {
    // Event Listeners
    this.agoraEngine.on("user-published", async (user, mediaType) => {
      await this.agoraEngine.subscribe(user, mediaType);
      console.log("User published -", mediaType);
      this.handleVSDKEvents("user-published", user, mediaType);
    });

    // Listen for the "user-unpublished" event.
    this.agoraEngine.on("user-unpublished", (user, mediaType) => {
      console.log("user unpublished ", user.uid + mediaType);
    });

    this.agoraEngine.on("user-joined", (user: IAgoraRTCRemoteUser) => {
      const userId = user.uid;
      console.log("remote user joined", userId);

    });
    this.agoraEngine.on("user-left", (user: IAgoraRTCRemoteUser) => {
      console.log("Remote user left", user.uid);
    })

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
          this.channelParameters.remoteVideoTrack.play(this.remotePlayerContainer.nativeElement);
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
