pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

let pdfDoc = null,
    pageNum = 1,
    pageIsRendering = false,
    pageNumIsPending = null;

const pdfCanvas = document.getElementById('pdf-render'),
      pdfCtx = pdfCanvas.getContext('2d'),
      drawCanvas = document.getElementById('draw-canvas'),
      drawCtx = drawCanvas.getContext('2d');

// إعدادات القلم
let drawing = false;
let colorPicker = document.getElementById('color-picker');
let brushSize = document.getElementById('brush-size');

// رفع ملف الـ PDF
document.getElementById('file-input').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file && file.type === 'application/pdf') {
    const fileReader = new FileReader();
    fileReader.onload = function() {
      const typedarray = new Uint8Array(this.result);
      pdfjsLib.getDocument(typedarray).promise.then((pdf) => {
        pdfDoc = pdf;
        document.getElementById('page-count').textContent = pdf.numPages;
        pageNum = 1;
        renderPage(pageNum);
      });
    };
    fileReader.readAsArrayBuffer(file);
  }
});

// عرض الصفحة
function renderPage(num) {
  pageIsRendering = true;

  pdfDoc.getPage(num).then((page) => {
    const viewport = page.getViewport({ scale: 1.5 });
    pdfCanvas.height = viewport.height;
    pdfCanvas.width = viewport.width;

    // ضبط شاشة الرسم بنفس حجم صفحة الـ PDF
    drawCanvas.height = viewport.height;
    drawCanvas.width = viewport.width;

    const renderCtx = {
      canvasContext: pdfCtx,
      viewport: viewport
    };

    page.render(renderCtx).promise.then(() => {
      pageIsRendering = false;
      if (pageNumIsPending !== null) {
        renderPage(pageNumIsPending);
        pageNumIsPending = null;
      }
    });

    document.getElementById('page-num').textContent = num;
  });
}

function queueRenderPage(num) {
  if (pageIsRendering) {
    pageNumIsPending = num;
  } else {
    renderPage(num);
  }
}

// التنقل بين الصفحات
document.getElementById('prev-page').addEventListener('click', () => {
  if (pageNum <= 1) return;
  pageNum--;
  queueRenderPage(pageNum);
});

document.getElementById('next-page').addEventListener('click', () => {
  if (pageNum >= pdfDoc.numPages) return;
  pageNum++;
  queueRenderPage(pageNum);
});

// برمجة الرسم والتظليل (يدعم اللمس وقلم التاب)
function startDrawing(e) {
  drawing = true;
  draw(e);
}

function stopDrawing() {
  drawing = false;
  drawCtx.beginPath();
}

function draw(e) {
  if (!drawing) return;

  const rect = drawCanvas.getBoundingClientRect();
  const x = (e.clientX || e.touches[0].clientX) - rect.left;
  const y = (e.clientY || e.touches[0].clientY) - rect.top;

  drawCtx.lineWidth = brushSize.value;
  drawCtx.lineCap = 'round';
  drawCtx.strokeStyle = colorPicker.value;

  drawCtx.lineTo(x, y);
  drawCtx.stroke();
  drawCtx.beginPath();
  drawCtx.moveTo(x, y);
}

// أحداث الماوس واللمس
drawCanvas.addEventListener('mousedown', startDrawing);
drawCanvas.addEventListener('mouseup', stopDrawing);
drawCanvas.addEventListener('mousemove', draw);

drawCanvas.addEventListener('touchstart', startDrawing);
drawCanvas.addEventListener('touchend', stopDrawing);
drawCanvas.addEventListener('touchmove', draw);

// مسح الرسم
document.getElementById('clear-canvas').addEventListener('click', () => {
  drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
});
