// Minimal static behaviour for the cloned listing page (gallery, read more, features).
(function () {
  "use strict";
  const photos = Array.from({ length: 12 }, (_, i) => `assets/img/photo-${String(i + 1).padStart(2, "0")}.jpg`);
  const main = document.getElementById("gallery-main-img");
  const thumbs = document.getElementById("gallery-thumbs");
  let idx = 0;
  function show(i) {
    idx = (i + photos.length) % photos.length;
    main.src = photos[idx];
    thumbs.querySelectorAll("img").forEach((t, j) => t.classList.toggle("on", j === idx));
  }
  photos.forEach((src, i) => {
    const t = document.createElement("img");
    t.src = src; t.alt = ""; t.loading = "lazy";
    t.addEventListener("click", () => show(i));
    thumbs.appendChild(t);
  });
  document.querySelector(".g-prev").addEventListener("click", () => show(idx - 1));
  document.querySelector(".g-next").addEventListener("click", () => show(idx + 1));
  show(0);

  const rm = document.getElementById("read-more");
  const content = document.getElementById("property-content");
  rm.addEventListener("click", () => {
    const open = content.classList.toggle("open");
    rm.textContent = open ? "Read Less" : "Read More";
  });

  const features = {
    Interior: ["Air Conditioning", "Apart Kitchen", "Balcony", "Dressing Room", "En-Suite Bathroom", "Kitchen Appliances", "Open-Plan Kitchen", "Shower", "Satellite TV"],
    Exterior: ["Car Park", "Car Park (Closed)", "Caretaker", "Communal Garden", "Communal Pool", "Fitness", "In A Complex", "Lift", "Playground", "Private Garden", "Sauna", "Security 7/24", "Security Camera", "Wheelchair Friendly"],
    Location: ["Airport (0-50 Km)", "Mountain View", "City View", "Metro", "Stores / Shopping Mall"],
    Heating: ["Air Conditioning", "Gas Combi"],
    Orientation: ["West", "East", "North", "South", "North-West", "North-East", "South-West", "South-East"],
  };
  document.getElementById("features").innerHTML = Object.entries(features)
    .map(([k, v]) => `<label>${k}</label><ul>${v.map((x) => `<li>${x}</li>`).join("")}</ul>`).join("");
})();
