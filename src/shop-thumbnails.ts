import type { VehicleKind } from './vehicles';
import type { VehicleThumbnailSources } from './vehicle-thumbnails';

let sources: Promise<VehicleThumbnailSources> | undefined;
/** Load art only when the shop needs images. Detached renders cannot overwrite
 * the current shop; failed previews leave the labelled purchase UI usable. */
export function fillShopThumbnails(host: HTMLElement): void {
  const images = [...host.querySelectorAll<HTMLImageElement>('img[data-vehicle-thumbnail]')];
  if (!images.length) return;
  sources ??= import('./vehicle-thumbnails').then(module => module.vehicleThumbnailSources());
  void sources.then(thumbnails => {
    for (const image of images) if (host.contains(image)) {
      image.src = thumbnails[image.dataset.vehicleThumbnail as VehicleKind];
    }
  }).catch(() => {
    for (const image of images) if (host.contains(image)) image.dataset.unavailable = 'true';
  });
}
