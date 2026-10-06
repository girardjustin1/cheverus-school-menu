export type MealType = 'lunch' | 'breakfast';
export type BreakfastStatus = 'not_answered' | 'declined' | 'selected';
export type EdpStatus = 'not_answered' | 'attending' | 'not_attending';
export interface Profile { id: string; display_name: string; email: string; role: 'parent' | 'admin' }
export interface Child { id: string; parent_user_id: string; first_name: string; last_name: string; teacher_name: string; teacher_email: string; homeroom: string; active: boolean }
export interface MenuCategory { id: string; menu_month_id: string; meal_type: MealType; name: string; description: string; selection_mode: 'single' | 'multiple' | 'informational'; required: boolean; sort_order: number }
export interface MenuOption { id: string; menu_day_id: string; menu_category_id: string; meal_type: MealType; name: string; description: string; dietary_label: string; unavailable: boolean; sort_order: number; illustration?: 'hot' | 'sunbutter' | 'cheese' }
export interface MenuDay { id: string; menu_month_id: string; service_date: string; weekday: number; title: string; note: string; no_school: boolean; breakfast_available: boolean; breakfast_mode: 'opt_in' | 'choices'; lunch_available: boolean; edp_available: boolean | null; edp_note: string; sort_order: number; options: MenuOption[] }
export interface MenuMonth { id: string; school_year: string; year: number; month: number; title: string; description: string; status: 'draft' | 'published' | 'archived'; source_reference: string; categories: MenuCategory[]; days: MenuDay[] }
export interface DailyRequest { child_id: string; menu_day_id: string; breakfast_status: BreakfastStatus; edp_status: EdpStatus; option_ids: string[]; option_names?: Record<string, string>; updated_at?: string }
export interface EmailDraft { id: string; child_id: string; menu_month_id: string; recipient: string; subject: string; body: string; service_dates: string[]; created_at: string; opened_at: string | null }
export interface Family { profile: Profile; children: Child[]; requests: DailyRequest[]; drafts: EmailDraft[] }
