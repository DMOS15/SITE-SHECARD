function getPdfContainer(target) {
	const container = target || document.getElementById('pdf-export-container') || document.createElement('div');
	container.id = container.id || 'pdf-export-container';
	if (!container.parentNode) document.body.appendChild(container);
	let exportCard = container.querySelector('#export-card');
	if (!exportCard) { exportCard = document.createElement('div'); exportCard.id = 'export-card'; container.appendChild(exportCard); }
	return exportCard;
}

function preparePdfContainer(container) {
	container.innerHTML = '';
	Object.assign(container.style, { position: 'fixed', left: '0px', top: '0px', width: '340px', height: '480px', margin: '0', padding: '0', overflow: 'visible', display: 'block', visibility: 'visible', pointerEvents: 'none', zIndex: '2147483647', background: 'transparent' });
}

function logCaptureGeometry(card) {
	const describe = (element) => element ? { rect: element.getBoundingClientRect().toJSON(), offsetWidth: element.offsetWidth, offsetHeight: element.offsetHeight, overflow: getComputedStyle(element).overflow, objectFit: getComputedStyle(element).objectFit } : null;
	console.log('Capture geometry', { card: describe(card), photo: describe(card.querySelector('.badge-photo')), photoImage: describe(card.querySelector('.badge-photo img')), qr: describe(card.querySelector('.badge-qr')), qrImage: describe(card.querySelector('.badge-qr img')) });
}

async function captureRenderedCard(card, container) {
	preparePdfContainer(container);
	const exportCard = card.cloneNode(true);
	container.appendChild(exportCard);
	logCaptureGeometry(exportCard);
	await document.fonts?.ready;
	await Promise.all([...exportCard.querySelectorAll('img')].map((image) => image.complete && image.naturalWidth > 0 ? Promise.resolve() : new Promise((resolve) => { image.onload = resolve; image.onerror = resolve; })));
	await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
	const canvas = await html2canvas(exportCard, { scale: 4, backgroundColor: null, x: 0, y: 0, scrollX: 0, scrollY: 0, useCORS: true, logging: false, imageTimeout: 0 });
	console.log('PDF canvas', { width: canvas.width, height: canvas.height });
	exportCard.remove();
	return canvas;
}

async function generateBadgePDF(cards, target = null) {
	if (!cards.length) return;
	if (!window.html2canvas || !window.jspdf?.jsPDF) { window.alert('A biblioteca de PDF ainda não foi carregada. Verifique a conexão com a internet e tente novamente.'); return; }
	const container = getPdfContainer(target);
	const { jsPDF } = window.jspdf;
	let pdf = null;
	try {
		for (let index = 0; index < cards.length; index += 1) {
			const canvas = await captureRenderedCard(cards[index], container);
			if (!pdf) pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvas.width, canvas.height] });
			else pdf.addPage([canvas.width, canvas.height], 'portrait');
			const image = canvas.toDataURL('image/png');
			console.log('Canvas size', canvas.width, canvas.height);
			console.log('PDF position', { pdfX: 0, pdfY: 0, cardWidth: canvas.width, cardHeight: canvas.height });
			pdf.addImage(image, 'PNG', 0, 0, canvas.width, canvas.height);
		}
		if (pdf) pdf.save('Crachas.pdf');
	} finally { container.innerHTML = ''; container.style.cssText = ''; }
}

async function printBadge(card, target = null) {
	const printWindow = window.open('', '_blank');
	if (!printWindow) { window.alert('Permita pop-ups para imprimir o crachá.'); return; }
	const container = getPdfContainer(target);
	try {
		const canvas = await captureRenderedCard(card, container);
		const image = canvas.toDataURL('image/png');
		printWindow.document.write(`<html><head><title>Imprimir crachá</title><style>@page{size:A6 portrait;margin:0}html,body{margin:0;width:105mm;height:148mm}img{display:block;width:105mm;height:148mm;object-fit:contain}</style></head><body><img src="${image}" alt="Crachá"></body></html>`);
		printWindow.document.close();
		printWindow.onload = () => { printWindow.focus(); printWindow.print(); };
	} finally { container.innerHTML = ''; container.style.cssText = ''; }
}
