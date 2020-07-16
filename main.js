
const recognize = function (evt) {
    const files = evt.target.files;
    if (files.length == 0) {
        return;
    }

    Tesseract
        .recognize(files[0], { lang: 'jpn', tessedit_pageseg_mode: "RAW_LINE" })
        .progress(function (p) {
            // 進歩状況の表示
            let progressArea = document.getElementById("progress");
            progressArea.innerText =  p.status + " " + Math.round(p.progress * 100) + "%";
        })
        .then(function (result) {
            // 結果の表示
            let textarea = document.getElementById("ocrResult");
            textarea.value = result.text;
        });
}
const elm = document.getElementById('uploader');
elm.addEventListener('change', recognize);



let imgElement = document.getElementById('imageSrc');
let inputElement = document.getElementById('fileInput');
inputElement.addEventListener('change', (e) => {
  imgElement.src = URL.createObjectURL(e.target.files[0]);
}, false);

function grayscale(){
    let mat = cv.imread(imgElement);
//   var dst = new cv.Mat();
//   cv.cvtColor(mat, dst, cv.COLOR_RGBA2GRAY, 0);
//   let R=extract_ch(mat);
//   console.log(R)
    // let dst=binarize_with_color_info(mat);
    let dst=processing(mat);
    // let dst=extract_ch(mat);
    cv.imshow('canvasOutput', dst);
    mat.delete();
    dst.delete();
}

function binarize_with_color_info(src){
    let dst = cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC1);
    if (src.isContinuous()) {
        for (let row = 0; row < src.rows; ++row) {
            for (let col = 0; col < src.cols; ++col) {
                let R = src.data[row * src.cols * src.channels() + col * src.channels()];
                let G = src.data[row * src.cols * src.channels() + col * src.channels() + 1];
                let B = src.data[row * src.cols * src.channels() + col * src.channels() + 2];
                let A = src.data[row * src.cols * src.channels() + col * src.channels() + 3];
                if ((R>130) && (G>140) && (B>140)){
                    // dst.data[row * src.cols + col]=255
                    dst.ucharPtr(row,col)[0]=255
                }else{
                    // dst.data[row * src.cols + col]=0
                    dst.ucharPtr(row,col)[0]=0
                }
            }
        }
    }
    return dst;


}
function binarize(src){
    var dst = new cv.Mat();
    cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY, 0);
    cv.threshold(dst, dst, 100, 200, cv.THRESH_BINARY);
    // cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
    // cv.medianBlur(src, src, 5);
    // cv.adaptiveThreshold(src, dst, 200, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 3, 2);
    return dst    
}

function processing(src){
    // var dst = new cv.Mat();
    // cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY, 0);
    // cv.medianBlur(dst, dst, 5);
    // cv.Canny(dst, dst, 50, 100, 3, false);
    // dilation
    // let M = cv.Mat.ones(3, 3, cv.CV_8U);
    // let anchor = new cv.Point(-1, -1);
    // cv.dilate(dst, dst, M, anchor, 1, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());
    let dst = cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3);

    //// binarize

    // cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
    // cv.medianBlur(src, src, 5);
    // cv.adaptiveThreshold(src, src, 200, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 3, 2);

    // cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
    // cv.threshold(src, src, 100, 200, cv.THRESH_BINARY);

    src= binarize_with_color_info(src);

    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    let poly = new cv.MatVector();
    cv.findContours(src, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);
    // approximates each contour to polygon
    for (let i = 0; i < contours.size(); ++i) {
        let tmp = new cv.Mat();
        let cnt = contours.get(i);
        // You can try more different parameters
        let cnt_length = cv.arcLength(cnt, true);
        console.log(cnt_length)
        // cv.approxPolyDP(cnt, tmp, 3, false);

        cv.approxPolyDP(cnt, tmp, cnt_length*0.01, false);
        // for (let j = 0; j < tmp.data32S.length; j += 2){
        //     let p = {}
        //     p.x = tmp.data32S[j]
        //     p.y = tmp.data32S[j+1]
        //     console.log(p);
        //     // points[i].push(p)
        //   }
        let area = cv.contourArea(tmp, false);
        let polygonnum = tmp.data32S.length;
        if (polygonnum<14 && polygonnum>8 && area>400){
            poly.push_back(tmp);
        }
        // poly.push_back(tmp);
        cnt.delete();
        tmp.delete();
        

    }
    // draw contours with random Scalar
    for (let i = 0; i < poly.size(); ++i) {
        let color = new cv.Scalar(Math.round(Math.random() * 255), Math.round(Math.random() * 255),
                                  Math.round(Math.random() * 255));
        cv.drawContours(dst, poly, i, color, 1, 8, hierarchy, 0);
    }
    return dst;
};


function onOpenCvReady() {
  document.getElementById('status').innerHTML = 'OpenCV.js is ready.';
}
