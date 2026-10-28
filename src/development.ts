import { forceScenario } from './force-scenarios';
import { cargoScenario } from './cargo-scenarios';
import { movingScenario } from './moving-scenarios';
import { movingEvent } from './moving-events';
import type { Run } from './survival';
import { entity, fillWorld, initialWorld, passengerMotion, trafficTypes } from './world';
import { junction, junctionWindow } from './route';
import { newVehicle, vehicles, type VehicleKind } from './vehicles';
import { balance, itemBalance, movingBalance, stressBalance } from './config';
import { secretPickup, secretVehicle } from './secret';
/** Manual QA fixtures. Imported only through a DEV branch; no player-facing control. */
export function developmentScenario(run: Run, scenario: string | null, checkpoint = 0): Run {
  if (scenario === 'recovery-motorcycle' || scenario === 'recovery-motorbike' || scenario === 'wreck-open-drivers') {
    const kind = scenario === 'recovery-motorbike' ? 'motorbike' : 'motorcycle';
    const bike = newVehicle(kind, 'qa-recovery-bike');
    const entities = scenario === 'wreck-open-drivers' ?
      (['motorcycle', 'motorbike', 'tricycle'] as const).map((trafficKind, i) => ({
        ...entity('traffic', `qa-open-wreck-${i}`, 18 + i * 5, (i - 1) * 3.2), trafficKind,
        width: trafficTypes[trafficKind].width, length: trafficTypes[trafficKind].length,
        speed: 0, baseSpeed: 0, hp: 0, wrecked: true, wreckAge: 0,
      })) : [{ ...entity('traffic', 'qa-recovery-hit', 8, 0), speed: 0, baseSpeed: 0 }];
    return { ...run, vehicleInstances: [bike], activeVehicleId: bike.id, speed: vehicles[kind].cruiseSpeed,
      fuel: bike.fuel, durability: bike.durability,
      world: { ...initialWorld(run.seed), entities, nextHazard: 1e9, nextSpecial: 1e9, nextFuel: 1e9,
        nextRepair: 1e9, nextPassenger: 1e9, nextShopDistance: 1e9,
        prototype: { version: 'bike-recovery-qa-1', title: scenario === 'wreck-open-drivers' ? 'Xe hỏng không còn tài xế ngồi' : 'Ngã xe và dựng xe',
          description: 'Fixture DEV: quan sát trạng thái hình ảnh, không thay luật tai nạn hay cân bằng. Start để xem va chạm/ngã/quay lại/dựng xe.' } } };
  }
  if (scenario?.startsWith('lights-')) {
    const requested = scenario.slice(7);
    const kind = requested in vehicles ? requested as VehicleKind : 'car4';
    const car = newVehicle(kind, 'qa-lights-player');
    const start = junctionWindow(junction(run.seed, 0), vehicles[kind].cruiseSpeed, kind).openDistance + 1;
    const oncoming = entity('traffic', 'qa-lights-oncoming', start + 28, -3.2);
    Object.assign(oncoming, { speed: -6, baseSpeed: -6, hp: trafficTypes.car4.hp });
    const stopped = entity('traffic', 'qa-lights-stopped', start + 16, 3.2);
    Object.assign(stopped, { speed: 0, baseSpeed: 0, hp: trafficTypes.car4.hp, fuel: 0, trafficMotion: 'stopped' });
    return { ...run, distance: start, vehicleInstances: [car], activeVehicleId: car.id,
      fuel: car.fuel, durability: car.durability, speed: vehicles[kind].cruiseSpeed,
      world: { ...initialWorld(run.seed), entities: [oncoming, stopped], nextHazard: 1e9,
        nextSpecial: 1e9, nextFuel: 1e9, nextRepair: 1e9, nextPassenger: 1e9, nextShopDistance: 1e9,
        prototype: { version: 'vehicle-lights-qa-1', title: `Đèn xe · ${vehicles[kind].name}`,
          description: 'Q/E chọn rẽ thật để xem xi nhan, S phanh. Xe đối diện có pha; xe hết xăng bật cảnh báo hai bên. Fixture DEV, không dùng cân bằng.' } } };
  }
  if (scenario === 'vfx-state-check') {
    // DEV-only visual comparison. Real HP/wreck/fuel states drive the renderer;
    // no new production timer, collision rule or balance profile is introduced.
    const car = newVehicle('car4', 'qa-vfx-player');
    const wreck = entity('traffic', 'qa-vfx-wreck', 8, 3.2);
    Object.assign(wreck, { trafficKind: 'truck', width: trafficTypes.truck.width,
      length: trafficTypes.truck.length, hp: 0, wrecked: true, wreckAge: 0, speed: 0, baseSpeed: 0,
      wreckPassengersSpawned: true });
    const stopped = entity('traffic', 'qa-vfx-fuel-stop', 8, -3.2);
    Object.assign(stopped, { hp: trafficTypes.car4.hp, fuel: 0, trafficMotion: 'stopped', speed: 0, baseSpeed: 0 });
    return { ...run, vehicleInstances: [car], activeVehicleId: car.id,
      fuel: car.fuel, durability: car.durability, speed: vehicles.car4.cruiseSpeed,
      inventory: ['star', 'nitro'],
      world: { ...initialWorld(run.seed), entities: [wreck, stopped], nextHazard: 1e9,
        nextSpecial: 1e9, nextFuel: 1e9, nextRepair: 1e9, nextPassenger: 1e9, nextShopDistance: 1e9,
        prototype: { version: 'vfx-state-check', title: 'Kiểm trạng thái VFX · DEV',
          description: 'Bên phải là xe tải đã hỏng; bên trái là ô tô còn nguyên HP nhưng hết xăng. Quan sát khói/lửa, đèn và thu hồi khi wreck hết hạn. 1 bật star, 2 bật nitro; Space nhảy. Chỉ là fixture kiểm hình, không dùng để cân bằng.' } } };
  }
  if (scenario === 'force-tail-bus' || scenario === 'force-tail-truck' || scenario === 'force-tail-container') {
    const kind = scenario === 'force-tail-bus' ? 'bus' : scenario === 'force-tail-truck' ? 'truck' : 'container';
    const vehicle = newVehicle(kind, `qa-tail-${kind}`);
    const car = entity('traffic', `qa-tail-target-${kind}`, 32, kind === 'bus' ? 2.5 : kind === 'truck' ? 2.4 : 2.3);
    car.speed = 0; car.baseSpeed = 0;
    return { ...run, vehicleInstances: [vehicle], activeVehicleId: vehicle.id,
      fuel: vehicle.fuel, durability: vehicle.durability, speed: vehicles[kind].maxSpeed,
      world: { ...initialWorld(run.seed), entities: [car], nextSpecial: 1e9,
        nextHazard: 1e9, nextFuel: 1e9, nextRepair: 1e9, nextPassenger: 1e9,
        nextShopDistance: 1e9, prototype: { version: 'force-tail-qa-2',
          title: `Thử xe dài · ${vehicles[kind].name}`,
          description: kind === 'bus' ?
            'Giữ D để xem đầu xe buýt quét sang phải trong khi bánh sau bám hơn; nhả D và thử S để so cua chậm. Chỉ ver.force có mô phỏng này.' :
            kind === 'truck' ? 'Giữ D để xem đầu xe tải quét ra ngoài, nhẹ hơn xe buýt; bánh sau bám đường. Nhả D rồi thử lại ở tốc độ chậm.' :
            'Giữ D để xem đầu kéo rẽ trước, rơ-moóc theo sau qua khớp nối. So với ver.noforce, container chướng ngại vẫn nguyên một khối.' } } };
  }
  if (scenario === 'force-npc-hit') {
    const npc = entity('passenger', 'qa-force-npc', 18, 0);
    npc.passengerMotion = { ...passengerMotion(npc, 0), idle: true };
    return { ...run, world: { ...initialWorld(run.seed), entities: [npc], nextSpecial: 1e9,
      nextHazard: 1e9, nextFuel: 1e9, nextRepair: 1e9, nextPassenger: 1e9,
      nextShopDistance: 1e9, prototype: { version: 'force-npc-qa-1', title: 'Thử xe tông NPC',
        description: 'Lái thẳng để xem NPC bị hất văng, nằm xuống rồi đứng dậy. Ở ver.force, NPC bị bạn tông từ chối lên xe; ver.noforce giữ hành vi cũ để đối chiếu.' } } };
  }
  if (scenario?.startsWith('handling-')) {
    const requested = scenario.slice('handling-'.length);
    const kind: VehicleKind = requested in vehicles ? requested as VehicleKind : 'motorcycle';
    const vehicle = newVehicle(kind, `qa-handling-${kind}`);
    return { ...run, vehicleInstances: [vehicle], activeVehicleId: vehicle.id,
      fuel: vehicle.fuel, durability: vehicle.durability, speed: vehicles[kind].cruiseSpeed,
      world: { ...initialWorld(run.seed), nextSpecial: 1e9, nextHazard: 1e9,
        nextFuel: 1e9, nextRepair: 1e9, nextPassenger: 1e9, nextShopDistance: 1e9,
        prototype: { version: 'handling-qa-1', title: `Thử độ bám · ${vehicles[kind].name}`,
          description: 'Đường trống để thử quán tính ngang. Giữ W rồi đánh lái A/D, thả lái để thấy xe trượt tiếp; giữ S và lặp lại ở tốc độ thấp. Đây là fixture DEV, không dùng để cân bằng mật độ chướng ngại.' } } };
  }
  if (scenario === 'p7-secret' || scenario === 'p7-secret-traffic') {
    // DEV checkpoint starts at step two; the normal game still requires a real purchase and three pickups.
    const car = newVehicle('car4', 'qa-p7-car'), riders = ['qa-p7-1', 'qa-p7-2', 'qa-p7-3'];
    const train = entity('train', 'qa-p7-train', 15, movingBalance.trainOrigin);
    train.width = movingBalance.trainWidth; train.length = movingBalance.trainDepth;
    train.crossMotion = { type: 'linear', origin: movingBalance.trainOrigin,
      velocity: -movingBalance.trainSpeed, startedAt: 0, min: -movingBalance.trainOrigin, max: movingBalance.trainOrigin };
    const target = entity(scenario === 'p7-secret-traffic' ? 'traffic' : 'accident',
      'qa-p7-final-contact', 48, 0);
    if (target.kind === 'traffic') { target.trafficKind = 'bus'; target.width = trafficTypes.bus.width; target.length = trafficTypes.bus.length; target.hp = trafficTypes.bus.hp; target.speed = 0; }
    else { target.width = 6.2; target.length = 5; }
    const secret = secretPickup(secretVehicle(run.secret, 'car4', car.id, 0), car.id, 3);
    return { ...run, vehicleInstances: [car], activeVehicleId: car.id, fuel: car.fuel,
      durability: car.durability, speed: vehicles.car4.cruiseSpeed, riderIds: riders,
      secret, inventory: ['nitro', null],
      world: { ...initialWorld(run.seed), experimentalMotion: true, entities: [train, target],
        nextSpecial: 1e9, nextHazard: 1e9, nextFuel: 1e9, nextRepair: 1e9,
        nextPassenger: 1e9, nextShopDistance: 1e9,
        prototype: { version: 'p7-secret-qa', title: 'Thử kết ván bí mật',
          description: `Checkpoint sau khi xe ô tô 4 chỗ đón đủ 3 khách mới. Bấm 1 bật nitro, Space nhảy qua tàu đang chạy ngang rồi chạm ${target.kind === 'traffic' ? 'xe chướng ngại' : 'vụ tai nạn'}. Đây là tình huống DEV; ván thường phải tự hoàn tất đủ các bước.` } } };
  }
  if (scenario?.startsWith('p63-')) return cargoScenario(run, scenario);
  if (scenario?.startsWith('p62-')) return forceScenario(run,scenario);
  if (scenario === 'stress') {
    const start = Number.isFinite(checkpoint) ? Math.max(0,Math.min(10000,Math.floor(checkpoint/stressBalance.gap)*stressBalance.gap)) : 0;
    const vehicle = newVehicle('container','qa-stress-container');
    const world = { ...initialWorld(run.seed,true), stress: true, prototype: { version: 'p61-stress-1', title: 'Stress test tích hợp',
      description: 'Chướng ngại dày, không cân bằng: hai traffic mỗi24m; nước/ổ gà dài, nhóm NPC, tàu, rào, hàng rong và cứu thương xen kẽ. Container + bus,10000tiền và chuối/nitro mẫu; luật ngã/hỏng/hết xăng và tàu kết ván vẫn giữ. R shop,Tab đổi xe; chơi lại cùng seed để tái hiện.' } };
    return { ...run, distance: start, route: { ...run.route, index: Math.floor(start/balance.junctionInterval) }, vehicleInstances: [vehicle,newVehicle('bus','qa-stress-bus')],activeVehicleId:vehicle.id,
      fuel:vehicle.fuel,durability:vehicle.durability,speed:vehicles.container.cruiseSpeed,money:stressBalance.money,
      inventory:['banana','nitro'],world:fillWorld(world,start,vehicle.fuel,vehicle.durability,1,vehicles.container,0,vehicles.container.cruiseSpeed) };
  }
  if (scenario === 'integrated-checkpoint') {
    // QA shortcut: generated normal world and director, with disclosed checkpoint resources.
    const vehicle = newVehicle('car4', 'qa-integrated-car');
    return { ...run, distance: 1050, money: 1000, vehicleInstances: [vehicle, newVehicle('motorcycle','qa-integrated-spare')],
      activeVehicleId: vehicle.id, fuel: vehicle.fuel, durability: vehicle.durability, speed: vehicles.car4.cruiseSpeed,
      inventory: ['banana','nitro'], route: { ...run.route, index: 1 },
      world: fillWorld(initialWorld(run.seed,true),1050,vehicle.fuel,vehicle.durability,1,vehicles.car4,0) };
  }
  if (scenario === 'integrated-hazards') {
    // Find a reproducible nearby wind/cargo pair after the seeded P8 director has made its choices.
    let preview = initialWorld(run.seed, true);
    const winds: number[] = [], sources: number[] = [];
    const inspected = new Set<string>();
    for (let at = 0; at <= 5000; at += 40) {
      preview = fillWorld(preview, at);
      for (const e of preview.entities) if (!inspected.has(e.id)) {
        inspected.add(e.id);
        if (e.kind === 'wind') winds.push(e.distance);
        if (e.cargoReleaseAt !== undefined) sources.push(e.distance);
      }
    }
    const paired = winds.find(wind => sources.some(source => source > wind && source < wind + 450));
    const start = Math.max(0, (paired ?? winds[0] ?? 1690) - 80);
    const vehicle = newVehicle('car4', 'qa-all-hazards-car');
    const filled = fillWorld(initialWorld(run.seed, true), start, vehicle.fuel, vehicle.durability, 1, vehicles.car4, 0);
    return { ...run, distance: start, money: 1000, route: { ...run.route, index: Math.floor(start / balance.junctionInterval) },
      vehicleInstances: [vehicle, newVehicle('motorcycle', 'qa-all-hazards-spare')], activeVehicleId: vehicle.id,
      fuel: vehicle.fuel, durability: vehicle.durability, speed: vehicles.car4.cruiseSpeed,
      inventory: ['star', 'nitro'], world: { ...filled,
        entities: filled.entities.filter(e => e.distance + e.length / 2 >= start - 12) } };
  }
  if (scenario === 'p8-water') {
    const vehicle = newVehicle('car4', 'qa-p8-water-car');
    let preview = initialWorld(run.seed, true);
    let longWater: number | undefined;
    for (let at = 0; at <= 3000 && longWater === undefined; at += 40) {
      preview = fillWorld(preview, at, vehicle.fuel, vehicle.durability, 1, vehicles.car4);
      longWater = preview.entities.find(e => e.kind === 'water' && e.width >= 5.7 &&
        e.length >= 20 && e.distance >= 850)?.distance;
    }
    const start = Math.max(0, (longWater ?? 1100) - 100);
    let world = initialWorld(run.seed, true);
    for (let at = 0; at < start; at += 40)
      world = fillWorld(world, at, vehicle.fuel, vehicle.durability, 1, vehicles.car4);
    world = fillWorld(world, start, vehicle.fuel, vehicle.durability, 1, vehicles.car4);
    return { ...run, distance: start, route: { ...run.route, index: Math.floor(start / balance.junctionInterval) },
      vehicleInstances: [vehicle, newVehicle('motorcycle', 'qa-p8-water-spare')],
      activeVehicleId: vehicle.id, fuel: vehicle.fuel, durability: vehicle.durability,
      speed: vehicles.car4.cruiseSpeed, money: 1000,
      world: { ...world, entities: world.entities.filter(e => e.distance + e.length / 2 >= start - 12),
        prototype: { version: 'p8-density-patterns-2', title: 'Thử vùng nước dày',
          description: 'Xe 4 chỗ bắt đầu trước một vùng nước dài hai làn. Đường và các pattern sau đó vẫn do seed bản chính sinh; A/D, W/S, Q/E, F, R hoạt động bình thường. Đây là checkpoint DEV, tài nguyên được cấp để thử.' } } };
  }
  if (scenario === 'p8-vendor') {
    const vendor = movingEvent(entity('jam', 'qa-p8-vendor', 75, 0), 5, run.seed, 0, 'vendor')[0];
    return { ...run, world: { ...initialWorld(run.seed, true), entities: [vendor],
      nextSpecial: 1e9, nextHazard: 1e9, nextFuel: 1e9, nextRepair: 1e9,
      nextPassenger: 1e9, nextShopDistance: 1e9,
      prototype: { version: 'p8-vendor-qa-1', title: 'Thử hàng rong băng đường',
        description: 'Hàng rong xuất hiện gần 75 m và bắt đầu chạy ngang khi xe thật sự đến gần. Thử cruise, W hoặc S; có thể Chơi lại để so cùng seed.' } } };
  }
  if (scenario === 'vehicle-repurchase') {
    const car = entity('traffic', 'qa-repurchase-hit', 8, 0); car.speed = 0;
    const shop = entity('shop', 'qa-repurchase-shop', 65, 0);
    shop.shopStock = { vehicles: Object.keys(vehicles) as VehicleKind[], items: { nitro: 1, star: 1 } };
    return { ...run, durability: 20, money: 600,
      vehicleInstances: [...run.vehicleInstances, newVehicle('car4', `${run.runId}-car4`)],
      world: { ...initialWorld(run.seed, true), entities: [car, shop], nextSpecial: 1e9,
        nextHazard: 1e9, nextFuel: 1e9, nextRepair: 1e9, nextPassenger: 1e9,
        nextShopDistance: 1e9, prototype: { version: 'p8-vehicle-repurchase-qa-1', title: 'Thử mua lại xe hỏng',
          description: 'Xe máy 20 HP chạm xe trước mặt, tự chuyển sang ô tô dự phòng. Tới cửa hàng ở 65 m, nhấn R rồi mua lại xe máy.' } } };
  }
  if (scenario?.startsWith('p61-')) return movingScenario(run, scenario);
  if (scenario) run = { ...run, world: { ...run.world, integrated: false, experimentalMotion: false, experimentalTraffic: false, experimentalCargo: false } };
  if (scenario?.startsWith('events')) {
    const requested = scenario.slice('events-'.length);
    const kind = ['police', 'militia', 'jam', 'accident', 'train', 'broken'].includes(requested) ? requested as import('./special-events').SpecialKind : 'police';
    const obstacle = entity(kind, 'qa-event', 70, kind === 'jam' || kind === 'accident' ? -1.6 : 0);
    obstacle.eventAt = 0;
    return { ...run, money: 200, inventory: kind === 'train' ? ['nitro', 'star'] : ['banana', 'star'],
      vehicleInstances: [...run.vehicleInstances, newVehicle('car4', 'qa-event-reserve')],
      world: { ...run.world, entities: [obstacle], nextSpecial: 1e9, nextHazard: 1e9, nextFuel: 1e9,
        nextRepair: 1e9, nextPassenger: 1e9, nextShopDistance: 1e9 } };
  }
  if (scenario === 'grab-crash') {
    const vehicle = newVehicle('car4', 'qa-grab-crash');
    const car = entity('traffic', 'qa-grab-hit', 8, 0); car.speed = 0; car.baseSpeed = 0;
    const riders = ['qa-grab-0', 'qa-grab-1', 'qa-grab-2'];
    return { ...run, vehicleInstances: [vehicle], activeVehicleId: vehicle.id, speed: vehicles.car4.cruiseSpeed,
      fuel: vehicle.fuel, durability: vehicle.durability, riderIds: riders, grabRiderIds: [...riders],
      inventory: ['grab', null], grabUses: [itemBalance.grabUses, 0],
      world: { ...run.world, entities: [car], nextSpecial: 1e9, nextHazard: 1e9, nextFuel: 1e9, nextRepair: 1e9,
        nextPassenger: 1e9, nextShopDistance: 1e9 } };
  }
  if (scenario === 'grab' || scenario === 'grab-blocked') {
    const wall = entity('pothole', 'qa-grab-blocked', 100, 0); wall.width = 9.6; wall.length = 250;
    return { ...run, inventory: ['grab', null], grabUses: [itemBalance.grabUses, 0],
      vehicleInstances: [...run.vehicleInstances, newVehicle('car4', 'qa-grab-spare')],
      world: { ...run.world, entities: scenario === 'grab-blocked' ? [wall] : [], nextSpecial: 1e9, nextHazard: 1e9,
        nextFuel: 1e9, nextRepair: 1e9, nextPassenger: 1e9, nextShopDistance: 1e9 } };
  }
  if (scenario === 'items' || scenario === 'items-container') {
    const chosen = newVehicle(scenario === 'items-container' ? 'container' : 'motorcycle', 'qa-items');
    const hole = entity('pothole', 'qa-jump-hole', 24, 0); hole.width = 9.6; hole.length = 6;
    const water = entity('water', 'qa-star-water', 70, 0); water.width = 9.6; water.length = 35;
    const car = entity('traffic', 'qa-star-car', 80, 0); car.speed = 0; car.baseSpeed = 0;
    return { ...run, inventory: ['nitro', 'star'], vehicleInstances: [chosen], activeVehicleId: chosen.id,
      fuel: chosen.fuel, durability: chosen.durability, speed: vehicles[chosen.kind].cruiseSpeed,
      world: { ...run.world, entities: [hole, water, car], nextSpecial: 1e9, nextHazard: 1e9, nextFuel: 1e9,
        nextRepair: 1e9, nextPassenger: 1e9, nextShopDistance: 1e9 } };
  }
  if (scenario === 'shop' || scenario === 'shop-third' || scenario === 'shop-insufficient') {
    const shop = entity('shop', 'qa-shop', 12, 0);
    shop.shopStock = { vehicles: Object.keys(vehicles) as VehicleKind[], items: { nitro: 1, star: 1, grab: itemBalance.grabShopStock } };
    return { ...run, money: scenario === 'shop-insufficient' ? 20 : 4000, fuel: 1, durability: 30,
      riderIds: ['qa-shop-rider'],
      vehicleInstances: scenario === 'shop-third' ? [...run.vehicleInstances, newVehicle('car7', 'qa-spare')] : run.vehicleInstances,
      world: { ...run.world, entities: [shop], nextSpecial: 1e9, nextHazard: 1e9, nextFuel: 1e9, nextRepair: 1e9,
        nextPassenger: 1e9, nextShopDistance: 1e9 } };
  }
  if (scenario === 'vehicle-replacement' || scenario === 'vehicle-failure') {
    const car = entity('traffic', 'qa-vehicle-replacement', 8, 0); car.speed = 0;
    return { ...run, durability: 20,
      vehicleInstances: scenario === 'vehicle-replacement' ?
        [...run.vehicleInstances, newVehicle('car4', `${run.runId}-car4`)] : run.vehicleInstances,
      world: { ...run.world, entities: [car], nextSpecial: 1e9, nextHazard: 1e9, nextFuel: 1e9,
        nextRepair: 1e9, nextPassenger: 1e9 } };
  }
  if (scenario === 'vehicles' || scenario?.startsWith('vehicles-')) {
    const requested = scenario === 'vehicles' ? 'car4' : scenario!.slice('vehicles-'.length);
    const kind: VehicleKind = requested in vehicles ? requested as VehicleKind : 'car4';
    return { ...run, vehicleInstances: [...run.vehicleInstances, newVehicle(kind, `${run.runId}-${kind}`)] };
  }
  if (scenario?.startsWith('visual-vehicles-')) {
    const requested = scenario.slice('visual-vehicles-'.length);
    const kind: VehicleKind = requested in vehicles ? requested as VehicleKind : 'car4';
    const vehicle = newVehicle(kind, `${run.runId}-visual-${kind}`);
    return { ...run, activeVehicleId: vehicle.id, vehicleInstances: [vehicle],
      fuel: vehicle.fuel, durability: vehicle.durability,
      riderIds: Array.from({ length: vehicles[kind].capacity - 1 }, (_, i) => `visual-rider-${i}`),
      world: { ...run.world, nextSpecial: 1e9, nextHazard: 1e9, nextFuel: 1e9,
        nextRepair: 1e9, nextPassenger: 1e9 } };
  }
  if (scenario === 'passenger') return { ...run, world: { ...run.world, entities: [entity('passenger', 'qa-passenger', 5, 0)],
    nextSpecial: 1e9, nextHazard: 1e9, nextFuel: 1e9, nextRepair: 1e9, nextPassenger: 1e9 } };
  if (scenario === 'passenger-crash' || scenario === 'passenger-crash-car') {
    const car = { ...entity('traffic', 'qa-traffic', 8, 0), speed: 0 };
    const water = entity('water', 'qa-water', 16, 0); water.width = 9.6; water.length = 10;
    const hole = entity('pothole', 'qa-hole', 15, 0); hole.width = 9.6; hole.length = 8;
    const qaCar = newVehicle('car4', `${run.runId}-qa-car4`);
    return { ...run, riderIds: ['qa-rider-0', 'qa-rider-1', 'qa-rider-2'],
      ...(scenario === 'passenger-crash-car' ? { vehicleInstances: [...run.vehicleInstances, qaCar], activeVehicleId: qaCar.id,
        fuel: vehicles.car4.fuelCapacity, durability: vehicles.car4.durabilityCapacity } : {}),
      world: { ...run.world, entities: [car, water, hole],
      nextSpecial: 1e9, nextHazard: 1e9, nextFuel: 1e9, nextRepair: 1e9, nextPassenger: 1e9 } };
  }
  if (scenario === 'traffic-fuel' || scenario === 'traffic-fuel-oncoming') {
    const car = entity('traffic', 'qa-fuel-traffic', 90, scenario === 'traffic-fuel' ? balance.laneWidth : -balance.laneWidth);
    car.speed = scenario === 'traffic-fuel' ? 6 : -6; car.baseSpeed = car.speed;
    car.fuel = .006;
    return { ...run, world: { ...run.world, entities: [car], nextSpecial: 1e9, nextHazard: 1e9,
      nextFuel: 1e9, nextRepair: 1e9, nextPassenger: 1e9 } };
  }
  if (scenario === 'traffic-passengers' || scenario === 'traffic-passengers-pothole') {
    const bus = newVehicle('bus', `${run.runId}-qa-bus`);
    const car = entity('traffic', 'qa-passenger-source', 55, 0);
    car.speed = 0; car.baseSpeed = 0;
    const hole = entity('pothole', 'qa-source-pothole', 55, 0); hole.width = 2; hole.length = 24;
    return { ...run, activeVehicleId: bus.id, vehicleInstances: [bus],
      speed: vehicles.bus.cruiseSpeed, fuel: bus.fuel, durability: bus.durability,
      world: { ...run.world, entities: scenario === 'traffic-passengers-pothole' ? [car, hole] : [car],
        nextSpecial: 1e9, nextHazard: 1e9, nextFuel: 1e9, nextRepair: 1e9, nextPassenger: 1e9 } };
  }
  if (scenario === 'traffic-ram') {
    const bus = newVehicle('bus', `${run.runId}-qa-bus`);
    const car = entity('traffic', 'qa-small-car', 8, 0); car.speed = 0; car.baseSpeed = 0;
    return { ...run, activeVehicleId: bus.id, vehicleInstances: [...run.vehicleInstances, bus],
      fuel: bus.fuel, durability: bus.durability,
      world: { ...run.world, entities: [car], nextSpecial: 1e9, nextHazard: 1e9, nextFuel: 1e9,
        nextRepair: 1e9, nextPassenger: 1e9 } };
  }
  if (scenario === 'force-car-ram') {
    const player = newVehicle('car4', `${run.runId}-qa-player-car`);
    const target = entity('traffic', 'qa-peer-car', 17, 0);
    target.speed = 5; target.baseSpeed = 5;
    return { ...run, activeVehicleId: player.id, vehicleInstances: [player],
      speed: vehicles.car4.cruiseSpeed, fuel: player.fuel, durability: player.durability,
      world: { ...initialWorld(run.seed), entities: [target], nextSpecial: 1e9, nextHazard: 1e9,
        nextFuel: 1e9, nextRepair: 1e9, nextPassenger: 1e9, nextShopDistance: 1e9,
        prototype: { version: 'force-car-qa-1', title: 'Thử ô tô húc ô tô',
          description: 'Ô tô phía trước đang chạy cùng chiều. Lái thẳng để xem xe bị đẩy trượt rồi tiếp tục chạy; so cùng seed trên ver.force và ver.noforce.' } } };
  }
  if (scenario === 'traffic-gallery') {
    const entities = (Object.keys(trafficTypes) as VehicleKind[]).map((kind, i) => {
      const model = trafficTypes[kind], car = entity('traffic', `qa-${kind}`, 24 + i * 13,
        (i % 3 - 1) * balance.laneWidth);
      car.trafficKind = kind; car.hp = model.hp; car.width = model.width; car.length = model.length;
      car.speed = 0; car.baseSpeed = 0;
      return car;
    });
    return { ...run, world: { ...run.world, entities, nextSpecial: 1e9, nextHazard: 1e9, nextFuel: 1e9,
      nextRepair: 1e9, nextPassenger: 1e9 } };
  }
  if (scenario?.startsWith('traffic-kind-')) {
    const requested = scenario.slice('traffic-kind-'.length);
    if (Object.hasOwn(trafficTypes, requested)) {
      const kind = requested as VehicleKind, model = trafficTypes[kind];
      const car = entity('traffic', `qa-${kind}`, 24, 0);
      car.trafficKind = kind; car.hp = model.hp; car.width = model.width; car.length = model.length;
      car.speed = 0; car.baseSpeed = 0;
      return { ...run, world: { ...run.world, entities: [car], nextSpecial: 1e9, nextHazard: 1e9, nextFuel: 1e9,
        nextRepair: 1e9, nextPassenger: 1e9 } };
    }
  }
  if (scenario === 'branch-hazard') {
    const crossing = junction(run.seed, 1), distance = crossing.distance - 18;
    const traffic = entity('traffic', 'qa-old-branch', crossing.distance + 85, 0);
    traffic.speed = 0;
    const world = fillWorld(initialWorld(run.seed), distance);
    return { ...run, distance, route: { ...run.route, index: 1 },
      world: { ...world, entities: [...world.entities.filter(e => e.distance + e.length / 2 > distance - 12), traffic] } };
  }
  if (scenario === 'junction' || scenario === 'blocked-junction' || scenario === 'blocked-window') {
    const index = scenario === 'junction' ? 0 : Array.from({ length: 20 }, (_, i) => i + 1).find(i => junction(run.seed, i).blockedStraight)!;
    return { ...run, phase: 'ready', distance: junction(run.seed, index).distance - (scenario === 'blocked-window' ? 18 : 95),
      route: { ...run.route, index }, world: { ...run.world, entities: [], nextSpecial: 1e9, nextHazard: 1e9, nextFuel: 1e9, nextRepair: 1e9 } };
  }
  if (scenario !== 'coast' && scenario !== 'supplies' && scenario !== 'crash') return run;
  return { ...run, fuel: scenario === 'coast' ? .006 : scenario === 'supplies' ? 0 : run.fuel,
    durability: scenario === 'supplies' ? 30 : run.durability,
    motion: scenario === 'supplies' ? 'coasting' : 'powered',
    world: { ...run.world, nextSpecial: 1e9, nextHazard: 1e9, nextFuel: 1e9, nextRepair: 1e9,
      entities: scenario === 'supplies' ? [entity('fuel', 'qa-fuel', 6, 0), entity('repair', 'qa-repair', 12, 0)] :
        scenario === 'crash' ? [entity('traffic', 'qa-traffic', 8, 0)] : [] } };
}
