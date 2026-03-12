const stage = document.getElementById("stage");
const spotlight = document.getElementById("spotlight");
const sizeValue = document.getElementById("sizeValue");

const MIN_DIAMETER = 10;
const MAX_DIAMETER = 300;
const DEFAULT_DIAMETER = 100;

let spotlightSize = DEFAULT_DIAMETER;
let pinchDistance = null;

function clamp(value, min, max) {
	return Math.min(Math.max(value, min), max);
}

function setSpotlightSize(nextSize) {
	spotlightSize = clamp(Math.round(nextSize), MIN_DIAMETER, MAX_DIAMETER);
	spotlight.style.width = `${spotlightSize}px`;
	spotlight.style.height = `${spotlightSize}px`;
	stage.style.setProperty("--spotlight-diameter", `${spotlightSize}px`);
	sizeValue.textContent = String(spotlightSize);
}

function showSpotlight() {
	spotlight.style.opacity = "1";
}

function hideSpotlight() {
	spotlight.style.opacity = "0";
	stage.style.setProperty("--spotlight-x", "-9999px");
	stage.style.setProperty("--spotlight-y", "-9999px");
}

function pointInsideStage(x, y) {
	const rect = stage.getBoundingClientRect();
	return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

function moveSpotlight(clientX, clientY) {
	const rect = stage.getBoundingClientRect();
	if (!pointInsideStage(clientX, clientY)) {
		hideSpotlight();
		return;
	}

	const localX = clientX - rect.left;
	const localY = clientY - rect.top;

	stage.style.setProperty("--spotlight-x", `${localX}px`);
	stage.style.setProperty("--spotlight-y", `${localY}px`);
	spotlight.style.left = `${localX}px`;
	spotlight.style.top = `${localY}px`;
	showSpotlight();
}

stage.addEventListener("mousemove", (event) => {
	moveSpotlight(event.clientX, event.clientY);
});

stage.addEventListener("mouseleave", () => {
	hideSpotlight();
});

stage.addEventListener(
	"wheel",
	(event) => {
		event.preventDefault();
		const step = 10;
		const next = event.deltaY < 0 ? spotlightSize + step : spotlightSize - step;
		setSpotlightSize(next);
		moveSpotlight(event.clientX, event.clientY);
	},
	{ passive: false }
);

stage.addEventListener("touchstart", (event) => {
	if (event.touches.length === 1) {
		const touch = event.touches[0];
		moveSpotlight(touch.clientX, touch.clientY);
		pinchDistance = null;
	}

	if (event.touches.length === 2) {
		const [a, b] = event.touches;
		pinchDistance = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
		const centerX = (a.clientX + b.clientX) / 2;
		const centerY = (a.clientY + b.clientY) / 2;
		moveSpotlight(centerX, centerY);
	}
});

stage.addEventListener("touchmove", (event) => {
	event.preventDefault();

	if (event.touches.length === 1) {
		const touch = event.touches[0];
		moveSpotlight(touch.clientX, touch.clientY);
		pinchDistance = null;
		return;
	}

	if (event.touches.length === 2) {
		const [a, b] = event.touches;
		const currentDistance = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);

		if (pinchDistance !== null) {
			const delta = currentDistance - pinchDistance;
			setSpotlightSize(spotlightSize + (delta * 0.6));
		}

		pinchDistance = currentDistance;

		const centerX = (a.clientX + b.clientX) / 2;
		const centerY = (a.clientY + b.clientY) / 2;
		moveSpotlight(centerX, centerY);
	}
}, { passive: false });

stage.addEventListener("touchend", (event) => {
	if (event.touches.length === 0) {
		hideSpotlight();
		pinchDistance = null;
	}

	if (event.touches.length === 1) {
		pinchDistance = null;
	}
});

setSpotlightSize(DEFAULT_DIAMETER);
hideSpotlight();
