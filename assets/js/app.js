(() => {
  
  /**
   * WebRTCによるカメラアクセス
   */
  const video = document.getElementById('video')
  const canvas = document.getElementById('canvas')
  const ctx = canvas.getContext('2d')
  
  let isVideoRun = true
  let isLoadedMetaData = false
  let constraints = { audio: false, video: {facingMode: 'user'} }


  function start(){
    isVideoRun = true
    navigator.mediaDevices.getUserMedia( constraints )
      .then( mediaStrmSuccess )
      .catch( mediaStrmFailed )
  }

  function mediaStrmSuccess( stream ){
    video.srcObject = stream

    // ウェブカムのサイズを取得し、canvasにも適用
    if(isLoadedMetaData) return
    isLoadedMetaData = true

    video.addEventListener('loadedmetadata', () => {
      video.width = video.videoWidth      // posenet使用にあたりvideoタグの属性を指定
      video.height = video.videoHeight    // posenet使用にあたりvideoタグの属性を指定
      canvas.width = video.videoWidth  
      canvas.height = video.videoHeight

      posenet.load().then(function(n){
        net = n
      })

      requestAnimationFrame( draw )
    }, false)
  }

  function mediaStrmFailed( e ){
    console.log( e )
  }

  function stop(){
    isVideoRun = false
    let stream = video.srcObject
    let tracks = stream.getTracks()

    tracks.forEach( (track) => {
      track.stop()
    })
    video.srcObject = null
  }

  function draw(){
    if(!isVideoRun) return
    detectPose()
    requestAnimationFrame( draw )
  }

  start()


  /**
   * ストリームのコントロール
   */
  const stopBtn = document.getElementById('stop')
  const frontBtn = document.getElementById('front')
  const rearBtn = document.getElementById('rear')
  let isRun = false

  let ua = navigator.userAgent
  if(ua.indexOf('iPhone') < 0 && ua.indexOf('Android') < 0 && ua.indexOf('Mobile') < 0 && ua.indexOf('iPad') < 0){
    frontBtn.disabled = true
    rearBtn.disabled = true
  }

  stopBtn.addEventListener('click', () => {
    if(!isRun){
      stop()
      stopBtn.textContent = 'START'
    }else{
      start()
      stopBtn.textContent = 'STOP'
    }
    isRun = !isRun
  }, false)

  frontBtn.addEventListener('click', () => {
    stop()
    constraints.video.facingMode = 'user'
    setTimeout( () => {
      start()
    }, 500)
  }, false)

  rearBtn.addEventListener('click', () => {
    stop()
    constraints.video.facingMode = 'environment'
    setTimeout( () => {
      start()
    }, 500)
  }, false)


  /**
   * ポーズ認識
   */
  const outputTxt = document.querySelector('.output_txt')
  let imageScaleFactor = 0.5
  let outputStride = 16
  let flipHorizontal = true
  let maxPoseDetections = 2
  let net = null


  function detectPose(){
    // ctx.drawImage( video, 0, 0 )

    if(!net) return
    net.estimateMultiplePoses(video, imageScaleFactor, flipHorizontal, outputStride, maxPoseDetections).then(function(pose){
      // console.log(pose)
      let poseArray = pose
      // ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage( video, 0, 0 )

      for(let i = 0, icnt = poseArray.length; i < icnt; i++){
        let kp = poseArray[i].keypoints

        for(let j = 0, jcnt = kp.length; j < jcnt; j++){
          ctx.beginPath();
          ctx.arc(kp[j].position.x, kp[j].position.y, 6, 0, 2 * Math.PI);
          ctx.fillStyle = 'rgb(200, 0, 0)';
          ctx.fill();
          // ctx.fillRect(parseInt( kp[j].position.x, 10 ), parseInt( kp[j].position.y, 10 ), 30, 30)
        }
      }
    })
  }


})()