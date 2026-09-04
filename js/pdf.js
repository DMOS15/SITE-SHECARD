async function generatePdf(badges, target = document.getElementById('export-stage'), sourceCard = null) {
	if (!badges.length) return;
	if (!window.html2canvas || !window.jspdf?.jsPDF) {
		window.alert('A biblioteca de PDF ainda não foi carregada. Verifique a conexão com a internet e tente novamente.');
		return;
	}
	if (!target) {
		target = document.createElement('div');
		target.className = 'export-stage';
		document.body.appendChild(target);
	}
	const { jsPDF } = window.jspdf;
	const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
	let cards;
	if (sourceCard && badges.length === 1) {
		cards = [sourceCard];
	} else {
		target.innerHTML = '';
		badges.forEach((badge) => target.appendChild(createBadgeElement(badge)));
		await new Promise((resolve) => setTimeout(resolve, 700));
		cards = [...target.querySelectorAll('.badge-card')];
	}
	for (let index = 0; index < cards.length; index += 1) {
		if (index) pdf.addPage();
		const canvas = await html2canvas(cards[index], { scale: 3, backgroundColor: null, useCORS: true, logging: false, imageTimeout: 0 });
		const ratio = Math.min(200 / canvas.width, 287 / canvas.height);
		const width = canvas.width * ratio;
		const height = canvas.height * ratio;
		pdf.addImage(canvas.toDataURL('image/png'), 'PNG', (210 - width) / 2, (297 - height) / 2, width, height);
	}
	pdf.save('Crachas.pdf');
}
