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

function waitForImages(root, timeout = 3000) {
	return Promise.all([...root.querySelectorAll('img')].map((image) => new Promise((resolve, reject) => {
		if (image.complete && image.naturalWidth > 0) { resolve(); return; }
		let settled = false;
		const finish = (error = null) => { if (settled) return; settled = true; image.removeEventListener('load', onLoad); image.removeEventListener('error', onError); clearTimeout(timer); error ? reject(error) : resolve(); };
		const onLoad = () => image.naturalWidth > 0 ? finish() : finish(new Error('Imagem carregada sem dimensões.'));
		const onError = () => finish(new Error(`Imagem não carregada: ${image.alt || image.src}`));
		image.addEventListener('load', onLoad, { once: true });
		image.addEventListener('error', onError, { once: true });
		const timer = setTimeout(() => finish(new Error(`Tempo limite da imagem: ${image.alt || image.src}`)), timeout);
	})));
}

function waitForQr(root, timeout = 5000) {
	const qr = root.querySelector('.badge-qr');
	if (!qr) throw new Error('QR Code não encontrado no DOM.');
	return new Promise((resolve, reject) => {
		const isReady = () => {
			const image = qr.querySelector('img');
			const canvas = qr.querySelector('canvas');
			const svg = qr.querySelector('svg');
			return image && image.complete && image.naturalWidth > 0 || canvas && canvas.width > 0 && canvas.height > 0 || svg && svg.getBoundingClientRect().width > 0 && svg.getBoundingClientRect().height > 0;
		};
		if (isReady()) { resolve(); return; }
		const started = Date.now();
		const check = () => { if (isReady()) { resolve(); return; } if (Date.now() - started >= timeout) { reject(new Error('QR Code não terminou de renderizar.')); return; } requestAnimationFrame(check); };
		check();
	});
}

async function captureRenderedCard(card, container) {
	preparePdfContainer(container);
	const exportCard = card.cloneNode(true);
	container.appendChild(exportCard);
	try {
		logCaptureGeometry(exportCard);
		await Promise.race([document.fonts?.ready || Promise.resolve(), new Promise((resolve) => setTimeout(resolve, 3000))]);
		await waitForQr(exportCard);
		await waitForImages(exportCard);
		await new Promise((resolve) => { requestAnimationFrame(() => requestAnimationFrame(resolve)); setTimeout(resolve, 250); });
		const canvas = await Promise.race([
			html2canvas(exportCard, { scale: 4, backgroundColor: null, x: 0, y: 0, scrollX: 0, scrollY: 0, useCORS: true, logging: false, imageTimeout: 3000 }),
			new Promise((resolve, reject) => setTimeout(() => reject(new Error('Tempo limite da captura excedido.')), 30000))
		]);
		console.log('PDF canvas', { width: canvas.width, height: canvas.height });
		return canvas;
	} finally { exportCard.remove(); }
}

async function generateBadgePDF(cards, target = null) {
	if (!cards.length) return;
	if (!window.html2canvas || !window.jspdf?.jsPDF) { window.alert('A biblioteca de PDF ainda não foi carregada. Verifique a conexão com a internet e tente novamente.'); return; }
	const container = getPdfContainer(target);
	const { jsPDF } = window.jspdf;
	let pdf = null;
	let processed = 0;
	try {
		for (let index = 0; index < cards.length; index += 1) {
			try {
				const canvas = await captureRenderedCard(cards[index], container);
				if (!pdf) pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvas.width, canvas.height] });
				else pdf.addPage([canvas.width, canvas.height], 'portrait');
				const image = canvas.toDataURL('image/png');
				console.log('Canvas size', canvas.width, canvas.height);
				console.log('PDF position', { pdfX: 0, pdfY: 0, cardWidth: canvas.width, cardHeight: canvas.height });
				pdf.addImage(image, 'PNG', 0, 0, canvas.width, canvas.height);
				processed += 1;
			} catch (error) { console.error('Erro ao processar crachá:', cards[index].dataset.badgeId, error); }
		}
		if (pdf && processed) pdf.save('Crachas.pdf');
		else throw new Error('Nenhum crachá pôde ser capturado.');
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
