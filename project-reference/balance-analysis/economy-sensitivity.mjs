// Conditional economy sensitivity only. This is NOT the game simulation.
// No HP, fuel, collisions, boarding geometry, QTE, turning, upgrades, or spending.
// Rates and pickup/shop success probabilities are assumptions, not measured data.
// Run with Node: node economy-sensitivity.mjs
const quant = (a, p) => a.slice().sort((x, y) => x - y)[Math.floor((a.length - 1) * p)];
const profiles = [
  { name: 'Thận trọng', speed: 10, after: 8, pick: .7, shop: .9 },
  { name: 'Trung bình (giả định)', speed: 14, after: 12, pick: .85, shop: .9 },
  { name: 'Nhanh', speed: 20, after: 20, pick: .92, shop: .95 },
];
const results = [];
for (const profile of profiles) for (const variant of ['current', 'proposal']) {
  const times = [];
  for (let seed = 1; seed <= 3000; seed++) {
    let rng = seed >>> 0;
    const rand = () => { rng = (Math.imul(rng, 1664525) + 1013904223) >>> 0; return rng / 4294967296; };
    let d = 0, t = 0, money = 200, riders = 0;
    let nextPassenger = variant === 'current' ? 260 : 180;
    let nextShop = variant === 'current' ? 600 : 720, shopIndex = 0;
    while (t < 180) {
      const speed = riders ? profile.after : profile.speed, dt = .05;
      d += speed * dt; t += dt;
      money += speed * dt * ((variant === 'current' ? .5 : .02) + riders * (variant === 'current' ? .01 : .20));
      if (d >= nextPassenger) {
        if (!riders && rand() < profile.pick) riders = 1;
        nextPassenger += variant === 'current' ? 400 : 360;
      }
      if (d >= nextShop) {
        if (rand() < profile.shop && money >= (variant === 'current' ? 800 : 300)) { times.push(t); break; }
        shopIndex++;
        nextShop = shopIndex === 1 ? (variant === 'current' ? 1200 : 1500) : nextShop +
          (variant === 'current' ? 600 + Math.floor(rand() * 301) : 720 + Math.floor(rand() * 361));
      }
    }
  }
  results.push({ profile: profile.name, variant, seeds: 3000,
    boughtBy90: times.filter(t => t <= 90).length, boughtBy180: times.length,
    censored180: 3000 - times.length, p10: quant(times, .1), median: quant(times, .5), p90: quant(times, .9) });
}
console.log(JSON.stringify(results, null, 2));
