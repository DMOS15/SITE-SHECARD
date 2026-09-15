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

async function captureRenderedCard(card, container, saveDebug = false) {
	preparePdfContainer(container);
	const wasDisconnected = !card.isConnected;
	if (wasDisconnected) container.appendChild(card);
	const clone = card.cloneNode(true);
	const sourceRect = card.getBoundingClientRect();
	const width = card.offsetWidth || sourceRect.width;
	const height = card.offsetHeight || sourceRect.height;
	clone.style.setProperty('position', 'relative', 'important');
	clone.style.setProperty('left', '0px', 'important');
	clone.style.setProperty('top', '0px', 'important');
	clone.style.setProperty('margin', '0', 'important');
	clone.style.setProperty('transform', 'none', 'important');
	clone.style.setProperty('width', `${width}px`, 'important');
	clone.style.setProperty('height', `${height}px`, 'important');
	container.style.width = `${width}px`;
	container.style.height = `${height}px`;
	container.appendChild(clone);
	if (wasDisconnected) card.remove();
	console.log('BoundingRect', sourceRect);
	console.log('PDF source', card);
	console.log('PDF clone BoundingRect', clone.getBoundingClientRect());
	await document.fonts?.ready;
	await new Promise((resolve) => setTimeout(resolve, 100));
	const canvas = await html2canvas(clone, { scale: 3, backgroundColor: null, x: 0, y: 0, scrollX: 0, scrollY: 0, useCORS: true, logging: false, imageTimeout: 0 });
	console.log('PDF canvas', { width: canvas.width, height: canvas.height });
	if (saveDebug) { const debugLink = document.createElement('a'); debugLink.href = canvas.toDataURL('image/png'); debugLink.download = 'debug-export.png'; debugLink.click(); }
	return canvas;
}

async function generateBadgePDF(cards, target = null) {
	if (!cards.length) return;
	if (!window.html2canvas || !window.jspdf?.jsPDF) { window.alert('A biblioteca de PDF ainda não foi carregada. Verifique a conexão com a internet e tente novamente.'); return; }
	const container = getPdfContainer(target);
	const { jsPDF } = window.jspdf;
	const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
	const pageWidth = pdf.internal.pageSize.getWidth();
	const pageHeight = pdf.internal.pageSize.getHeight();
	const debugPdfBounds = false;
	try {
		for (let index = 0; index < cards.length; index += 1) {
			if (index) pdf.addPage();
			const canvas = await captureRenderedCard(cards[index], container, true);
			const image = canvas.toDataURL('image/png');
			const maxCardWidth = pageWidth - 10;
			const maxCardHeight = pageHeight - 10;
			const ratio = Math.min(maxCardWidth / canvas.width, maxCardHeight / canvas.height);
			const cardWidth = canvas.width * ratio;
			const cardHeight = canvas.height * ratio;
			const pdfX = (pageWidth - cardWidth) / 2;
			const pdfY = (pageHeight - cardHeight) / 2;
			console.log('Canvas size', canvas.width, canvas.height);
			console.log('PDF position', { pdfX, pdfY, cardWidth, cardHeight, pageWidth, pageHeight });
			if (debugPdfBounds) { pdf.setDrawColor(255, 0, 0); pdf.rect(0, 0, pageWidth, pageHeight); }
			pdf.addImage(image, 'PNG', pdfX, pdfY, cardWidth, cardHeight);
		}
		pdf.save('Crachas.pdf');
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
