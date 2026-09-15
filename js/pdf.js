function getPdfContainer(target) {
	if (target) return target;
	const container = document.getElementById('pdf-export-container') || document.createElement('div');
	container.id = 'pdf-export-container';
	if (!container.parentNode) document.body.appendChild(container);
	return container;
}

function preparePdfContainer(container) {
	container.innerHTML = '';
	Object.assign(container.style, { position: 'fixed', left: '0px', top: '0px', margin: '0', padding: '0', overflow: 'visible', display: 'block', visibility: 'visible', pointerEvents: 'none', zIndex: '2147483647', background: 'transparent' });
}

async function captureRenderedCard(card, container) {
	preparePdfContainer(container);
	const wasDisconnected = !card.isConnected;
	if (wasDisconnected) container.appendChild(card);
	const sourceRect = card.getBoundingClientRect();
	console.log('BoundingRect', sourceRect);
	console.log('Card rect', card.getBoundingClientRect());
	console.log('Card offset', { offsetLeft: card.offsetLeft, offsetTop: card.offsetTop, offsetWidth: card.offsetWidth, offsetHeight: card.offsetHeight });
	console.log('PDF source', card);
	await document.fonts?.ready;
	await new Promise((resolve) => setTimeout(resolve, 100));
	const canvas = await html2canvas(card, { scale: 1, backgroundColor: null, x: 0, y: 0, scrollX: 0, scrollY: 0, useCORS: true, logging: false, imageTimeout: 0 });
	console.log('PDF canvas', { width: canvas.width, height: canvas.height });
	if (wasDisconnected) card.remove();
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
