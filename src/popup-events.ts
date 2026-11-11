import type { Entity } from './world';
import type { FeedbackKind } from './feedback';
export const popupCaptions = {
 pickup:'ĐÓN KHÁCH',score:'+50 ĐIỂM',drop:'CHIM CÚC!',militia:'XIN TÍ PHÍ',police:'VỀ ĐỒN NHÉ',
 pothole:'VA Ổ GÀ',barrel:'THÙNG LĂN',accident:'TAI NẠNN',vendor:'ỐI HÀNG RONG',
 ambulance:'CỨUUUUUU',barrier:'ĐÀO ĐƯỜNG HẢ?!',train:'TÀUUUUUU!!!',repair:'SỬA CHỮA NÈ',
 fuel:'TIẾP TẾ XĂNG',empty:'HẾT XĂNG RỒI!',damage:'TOANGGGG XE',nitro:'BOOOOST!!!',
 star:'SUPERSTAR!!!',banana:'NÉ CHỐT!',grab:'NHẬN CUỐC!',
} as const;
export type PopupKind = keyof typeof popupCaptions;
export interface PopupEvent { sequence: number; kind: PopupKind; at: number; moneyLoss?: number }
interface PopupState { popupEvent?: PopupEvent; activeSeconds: number }
/** Presentation metadata only, with its own sequence so audio/gameplay event ids stay unchanged. */
export function recordPopup(state: PopupState, kind: PopupKind, moneyLoss?: number): void {
 state.popupEvent={sequence:(state.popupEvent?.sequence??0)+1,kind,at:state.activeSeconds,...(moneyLoss!==undefined?{moneyLoss}:{})};
}
export function withPopup<T extends PopupState>(state:T,kind:PopupKind):T {
 const next={...state};recordPopup(next,kind);return next;
}
export function feedbackPopup(kind:FeedbackKind,target?:Entity):PopupKind|undefined {
 switch(kind){
  case 'passenger':return 'pickup';case 'drop':return 'drop';case 'coast':return 'empty';
  case 'police':case 'militia':case 'pothole':case 'accident':case 'train':case 'fuel':case 'repair':return kind;
  case 'jam':return target?.crossingRole==='vendor'?'vendor':'barrier';
  case 'traffic':return target?.serviceRole==='ambulance'?'ambulance':target?.kind==='traffic'?'accident':undefined;
  case 'cargo':return 'barrel';
  default:return undefined;
 }
}
