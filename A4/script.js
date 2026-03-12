const input = document.getElementById("keywordInput");
const searchBtn = document.getElementById("searchBtn");
const clearBtn = document.getElementById("clearBtn");
const paragraph = document.getElementById("paragraphText");

const originalText = paragraph.textContent;

function escapeRegExp(text) {
	return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeHtml(text) {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/\"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

function buildDistinctColors(count) {
	const colors = [];
	const startHue = Math.floor(Math.random() * 360);

	for (let i = 0; i < count; i += 1) {
		const hue = (startHue + Math.round((360 / Math.max(count, 1)) * i)) % 360;
		colors.push(`hsl(${hue} 85% 75%)`);
	}

	return colors;
}

function getKeywords() {
	const raw = input.value.trim();
	if (!raw) {
		return [];
	}

	const unique = new Set();
	raw.split(",").forEach((part) => {
		const item = part.trim();
		if (item) {
			unique.add(item);
		}
	});

	return Array.from(unique);
}

function applyHighlights() {
	const keywords = getKeywords();
	paragraph.textContent = originalText;

	if (keywords.length === 0) {
		return;
	}

	const colorMap = new Map();
	const colors = buildDistinctColors(keywords.length);
	keywords.forEach((word, index) => {
		colorMap.set(word.toLowerCase(), colors[index]);
	});

	const sortedKeywords = [...keywords].sort((a, b) => b.length - a.length);
	const pattern = sortedKeywords.map((word) => escapeRegExp(word)).join("|");
	const regex = new RegExp(pattern, "gi");

	let result = "";
	let lastIndex = 0;
	let match = regex.exec(originalText);

	while (match) {
		const start = match.index;
		const end = start + match[0].length;
		const matchedText = originalText.slice(start, end);
		const key = matchedText.toLowerCase();
		const color = colorMap.get(key) || "#fde047";

		result += escapeHtml(originalText.slice(lastIndex, start));
		result += `<mark class="hl" style="--hl: ${color}">${escapeHtml(matchedText)}</mark>`;

		lastIndex = end;
		match = regex.exec(originalText);
	}

	result += escapeHtml(originalText.slice(lastIndex));
	paragraph.innerHTML = result;
}

function clearHighlights() {
	input.value = "";
	paragraph.textContent = originalText;
	input.focus();
}

searchBtn.addEventListener("click", applyHighlights);
clearBtn.addEventListener("click", clearHighlights);

input.addEventListener("keydown", (event) => {
	if (event.key === "Enter") {
		applyHighlights();
	}
});
