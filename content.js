// The single content source: every shown value, with its origin noted beside it.
export default {
  // Origin: DIGG's project brief: the largest message sent between SDK access points today, the limit this project works to lift.
  // Domibus 5.2.1's own domibus.properties (Payload section) also names 30MB as the size above which database payload storage is no longer recommended.
  sdkLimitMb: 30,

  // The big title on screen before the presentation starts: "DIGG" or "DOMIBUS". The T key switches between them live.
  title: "DIGG",

  // How much smoke there is around everything: 0 = none, 1 = the normal look, 2 = twice as big and thick.
  smoke: 0.1,

  // Act 1 captions, one per → press, in order. Keep exactly 15: each one belongs to a step of the animation.
  // {limit} is replaced with the SDK limit above (e.g. "30 MB").
  act1Captions: [
    "Two hospitals need to share a patient's information.",
    "Each hospital connects through its own access point, running Domibus.",
    "The access points belong to SDK, Secure Digital Communication.",
    "Hospital A sends a message to its access point.",
    "Domibus stamps it with a signature, so the receiver knows who sent it.",
    "Then it locks it with encryption, so only the receiver can open it.",
    "It travels straight to the receiving access point.",
    "The receiving Domibus unlocks it.",
    "It scans the stamp to check the signature.",
    "It sends an acknowledgement back, and Hospital B has the message.",
    "Now a DICOM study: the standard format for medical images, like a CT scan.",
    "It is larger than {limit}, the limit in SDK today, so it cannot get in.",
    "So today it is copied onto a USB stick,",
    "put in an envelope,",
    "and driven to the other hospital by post.",
  ],
};
