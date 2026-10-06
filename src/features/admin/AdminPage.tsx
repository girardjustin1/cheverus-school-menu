import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { getISODay, parseISO } from 'date-fns';
import { useSchool } from '../../app/WorkspaceContext';
import { saveMenu } from '../../lib/repository';
import { createMonth, publicationIssues } from '../../utils/menuBuilder';
import { dateLabel, emptyRequest } from '../../utils/plans';
import { DailyPlan } from '../../components/DailyPlan';
import type { MealType, MenuCategory, MenuDay, MenuMonth, MenuOption } from '../../types/domain';

export function AdminPage() {
  const { family, months, demo } = useSchool();
  if (family.profile.role !== 'admin')
    return <Alert severity="error">Administrator access is required to manage school menus.</Alert>;
  return (
    <MenuBuilder
      months={months}
      demo={demo}
      draftKey={`cheverus.admin-draft:${family.profile.id}:${demo}`}
    />
  );
}
function MenuBuilder({
  months,
  demo,
  draftKey,
}: {
  months: MenuMonth[];
  demo: boolean;
  draftKey: string;
}) {
  const client = useQueryClient();
  const [menu, setMenu] = useState<MenuMonth | null>(() => {
    const saved = sessionStorage.getItem(draftKey);
    if (saved) {
      try {
        return JSON.parse(saved) as MenuMonth;
      } catch {
        sessionStorage.removeItem(draftKey);
      }
    }
    return months[months.length - 1] ? structuredClone(months[months.length - 1]) : null;
  });
  const [dayId, setDayId] = useState(menu?.days[0]?.id || '');
  const [dirty, setDirty] = useState(() => !!sessionStorage.getItem(draftKey));
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newDate, setNewDate] = useState('2026-11');
  const [templateId, setTemplateId] = useState('');
  const [copyFood, setCopyFood] = useState(false);
  const [preview, setPreview] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const [extraDate, setExtraDate] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryMeal, setNewCategoryMeal] = useState<MealType>('lunch');
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  useEffect(() => {
    if (dirty && menu) sessionStorage.setItem(draftKey, JSON.stringify(menu));
    else sessionStorage.removeItem(draftKey);
  }, [dirty, menu, draftKey]);
  const change = (next: MenuMonth) => {
    setMenu(next);
    setDirty(true);
    setFeedback('');
  };
  const updateDay = (next: MenuDay) => {
    if (menu) change({ ...menu, days: menu.days.map((d) => (d.id === next.id ? next : d)) });
  };
  const day = menu?.days.find((d) => d.id === dayId) || menu?.days[0];
  const issues = menu ? publicationIssues(menu) : [];
  const persist = async (next: MenuMonth) => {
    setBusy(true);
    setError('');
    setFeedback('');
    try {
      await saveMenu(next, demo);
      setMenu(next);
      setDirty(false);
      setPublishOpen(false);
      await client.invalidateQueries({ queryKey: ['months'] });
      setFeedback(
        `${next.title} saved${next.status === 'published' ? ' and published' : ' as ' + next.status}.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save menu.');
    } finally {
      setBusy(false);
    }
  };
  const create = () => {
    const [year, month] = newDate.split('-').map(Number);
    if (!year || year < 2020 || year > 2100 || !month || month > 12) {
      setError('Choose a valid month between 2020 and 2100.');
      return;
    }
    if (months.some((m) => m.year === year && m.month === month)) {
      setError('That month already exists. Open it from the menu list.');
      return;
    }
    const next = createMonth(
      year,
      month,
      months.find((m) => m.id === templateId),
      copyFood,
    );
    setMenu(next);
    setDayId(next.days[0]?.id || '');
    setDirty(true);
    setCreateOpen(false);
    setError('');
  };
  return (
    <>
      <Typography
        sx={{ fontSize: 10, letterSpacing: 2, fontWeight: 700, mb: 1, color: 'text.secondary' }}
      >
        SCHOOL ADMINISTRATION
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mb: 3 }}>
        <Typography variant="h1" sx={{ fontSize: { xs: 33, md: 46 } }}>
          Monthly menu builder
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          disabled={dirty || busy}
          onClick={() => setCreateOpen(true)}
        >
          Create month
        </Button>
      </Box>
      {demo && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Demo admin — edits change only this device’s sample workspace.
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {feedback && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {feedback}
        </Alert>
      )}
      {dirty && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          You have unsaved menu edits. Save before switching months or leaving this editor.
        </Alert>
      )}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', mb: 3 }}>
        <TextField
          select
          label="Menu month"
          size="small"
          value={months.some((m) => m.id === menu?.id) ? menu!.id : ''}
          disabled={dirty || busy}
          onChange={(e) => {
            const m = months.find((m) => m.id === e.target.value)!;
            setMenu(structuredClone(m));
            setDayId(m.days[0]?.id || '');
          }}
          sx={{ width: 250 }}
        >
          <MenuItem value="" disabled>
            New unsaved month
          </MenuItem>
          {months.map((m) => (
            <MenuItem key={m.id} value={m.id}>
              {m.title} · {m.status}
            </MenuItem>
          ))}
        </TextField>
        {menu && (
          <Chip label={menu.status} color={menu.status === 'published' ? 'success' : 'default'} />
        )}
        {dirty && (
          <Button
            onClick={() => {
              const original = months.find((m) => m.id === menu?.id);
              setMenu(original ? structuredClone(original) : null);
              setDirty(false);
            }}
          >
            Discard edits
          </Button>
        )}
      </Box>
      {!menu ? (
        <Typography>Create your first month to generate its weekdays.</Typography>
      ) : (
        <>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 2,
              mb: 3,
            }}
          >
            <TextField
              label="Menu title"
              value={menu.title}
              onChange={(e) => change({ ...menu, title: e.target.value })}
            />
            <TextField
              label="Source / review reference"
              value={menu.source_reference}
              onChange={(e) => change({ ...menu, source_reference: e.target.value })}
            />
          </Box>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'minmax(0,1fr)', md: '240px minmax(0,1fr)' },
              gap: 3,
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h3" sx={{ mb: 1 }}>
                School dates
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'row', md: 'column' },
                  gap: 0.5,
                  maxHeight: { md: 620 },
                  overflow: 'auto',
                  mb: 2,
                }}
              >
                {menu.days.map((d) => (
                  <Button
                    key={d.id}
                    variant={d.id === day?.id ? 'contained' : 'text'}
                    onClick={() => setDayId(d.id)}
                    sx={{
                      justifyContent: 'flex-start',
                      whiteSpace: 'nowrap',
                      fontSize: 12,
                      minWidth: 160,
                    }}
                  >
                    {dateLabel(d.service_date)}
                    {d.no_school ? ' · Off' : ''}
                  </Button>
                ))}
              </Box>
              <TextField
                type="date"
                size="small"
                label="Add school date"
                slotProps={{ inputLabel: { shrink: true } }}
                value={extraDate}
                onChange={(e) => setExtraDate(e.target.value)}
              />
              <Button
                size="small"
                onClick={() => {
                  if (
                    !extraDate.startsWith(`${menu.year}-${String(menu.month).padStart(2, '0')}-`) ||
                    menu.days.some((d) => d.service_date === extraDate)
                  ) {
                    setError('Choose an unused date in this month.');
                    return;
                  }
                  const d: MenuDay = {
                    id: crypto.randomUUID(),
                    menu_month_id: menu.id,
                    service_date: extraDate,
                    weekday: getISODay(parseISO(extraDate)),
                    title: '',
                    note: '',
                    no_school: false,
                    breakfast_available: false,
                    breakfast_mode: 'opt_in',
                    lunch_available: true,
                    edp_available: null,
                    edp_note: '',
                    sort_order: menu.days.length,
                    options: [],
                  };
                  change({
                    ...menu,
                    days: [...menu.days, d].sort((a, b) =>
                      a.service_date.localeCompare(b.service_date),
                    ),
                  });
                  setDayId(d.id);
                }}
              >
                Add date
              </Button>
            </Box>
            <Box sx={{ minWidth: 0 }}>
              {day && <DayEditor day={day} categories={menu.categories} onChange={updateDay} />}
            </Box>
          </Box>
          <Divider sx={{ my: 4 }} />
          <Typography variant="h3" sx={{ mb: 2 }}>
            Meal categories & selection rules
          </Typography>
          <Box sx={{ display: 'grid', gap: 2 }}>
            {menu.categories.map((c) => (
              <Box
                key={c.id}
                sx={{
                  display: 'flex',
                  gap: 2,
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  p: 2,
                  bgcolor: 'white',
                  borderRadius: 2,
                  border: '1px solid #e3e6dd',
                }}
              >
                <Chip label={c.meal_type} />
                <TextField
                  size="small"
                  label="Category name"
                  value={c.name}
                  onChange={(e) =>
                    change({
                      ...menu,
                      categories: menu.categories.map((cat) =>
                        cat.id === c.id ? { ...cat, name: e.target.value } : cat,
                      ),
                    })
                  }
                  sx={{ width: 210 }}
                />
                <TextField
                  size="small"
                  label="Description"
                  value={c.description}
                  onChange={(e) =>
                    change({
                      ...menu,
                      categories: menu.categories.map((cat) =>
                        cat.id === c.id ? { ...cat, description: e.target.value } : cat,
                      ),
                    })
                  }
                  sx={{ flex: 1, minWidth: 200 }}
                />
                <TextField
                  select
                  size="small"
                  label="Selection rule"
                  value={c.selection_mode}
                  onChange={(e) =>
                    change({
                      ...menu,
                      categories: menu.categories.map((cat) =>
                        cat.id === c.id
                          ? {
                              ...cat,
                              selection_mode: e.target.value as MenuCategory['selection_mode'],
                            }
                          : cat,
                      ),
                    })
                  }
                  sx={{ width: 170 }}
                >
                  <MenuItem value="single">Choose one</MenuItem>
                  <MenuItem value="multiple">Choose multiple</MenuItem>
                  <MenuItem value="informational">Information only</MenuItem>
                </TextField>
                <FormControlLabel
                  label="Required"
                  control={
                    <Checkbox
                      checked={c.required}
                      disabled={c.meal_type === 'breakfast'}
                      onChange={(e) =>
                        change({
                          ...menu,
                          categories: menu.categories.map((cat) =>
                            cat.id === c.id ? { ...cat, required: e.target.checked } : cat,
                          ),
                        })
                      }
                    />
                  }
                />
              </Box>
            ))}
          </Box>
          <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
            <TextField
              size="small"
              label="New category name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              sx={{ width: 240 }}
            />
            <TextField
              size="small"
              select
              label="Meal"
              value={newCategoryMeal}
              onChange={(e) => setNewCategoryMeal(e.target.value as MealType)}
              sx={{ width: 150 }}
            >
              <MenuItem value="lunch">Lunch</MenuItem>
              <MenuItem value="breakfast">Breakfast</MenuItem>
            </TextField>
            <Button
              disabled={!newCategoryName.trim()}
              onClick={() => {
                change({
                  ...menu,
                  categories: [
                    ...menu.categories,
                    {
                      id: crypto.randomUUID(),
                      menu_month_id: menu.id,
                      meal_type: newCategoryMeal,
                      name: newCategoryName.trim(),
                      description: '',
                      selection_mode: 'single',
                      required: false,
                      sort_order: menu.categories.length,
                    },
                  ],
                });
                setNewCategoryName('');
              }}
            >
              Add category
            </Button>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 4 }}>
            <Button
              variant="contained"
              disabled={busy || !menu.title.trim()}
              onClick={() => void persist(menu)}
            >
              {busy ? 'Saving…' : 'Save changes'}
            </Button>
            <Button variant="outlined" onClick={() => setPreview(true)} disabled={!day}>
              Preview as parent
            </Button>
            {menu.status === 'published' ? (
              <Button
                variant="outlined"
                disabled={busy}
                onClick={() => void persist({ ...menu, status: 'draft' })}
              >
                Unpublish
              </Button>
            ) : (
              <Button
                variant="outlined"
                disabled={busy}
                onClick={() => {
                  setReviewed(false);
                  setPublishOpen(true);
                }}
              >
                Publish menu
              </Button>
            )}
            <Button disabled={busy} onClick={() => void persist({ ...menu, status: 'archived' })}>
              Archive month
            </Button>
          </Box>
        </>
      )}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create a monthly menu</DialogTitle>
        <DialogContent>
          <TextField
            type="month"
            label="Month and year"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            sx={{ mt: 1, mb: 2 }}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            select
            label="Duplicate structure from"
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
          >
            <MenuItem value="">Start fresh</MenuItem>
            {months.map((m) => (
              <MenuItem key={m.id} value={m.id}>
                {m.title}
              </MenuItem>
            ))}
          </TextField>
          <FormControlLabel
            sx={{ mt: 1 }}
            label="Also copy food choices (by weekday)"
            control={
              <Checkbox
                checked={copyFood}
                disabled={!templateId}
                onChange={(e) => setCopyFood(e.target.checked)}
              />
            }
          />
          <Typography variant="body2" color="text.secondary">
            Weekdays are generated automatically. Review holidays and each service schedule before
            publishing. Food choices copy only when explicitly selected.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={create}>
            Generate weekdays
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={preview} onClose={() => setPreview(false)} fullWidth maxWidth="md">
        <DialogTitle>Parent preview · {day ? dateLabel(day.service_date) : ''}</DialogTitle>
        <DialogContent>
          {menu && day && (
            <DailyPlan
              day={day}
              categories={menu.categories}
              childName="your child"
              request={emptyRequest('preview', day.id)}
              disabled
              onChange={() => {}}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreview(false)}>Close preview</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={publishOpen} onClose={() => setPublishOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Publish {menu?.title}?</DialogTitle>
        <DialogContent>
          {issues.length ? (
            <Alert severity="warning">
              Resolve these items first:
              <Box component="ul" sx={{ pl: 2 }}>
                {issues.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </Box>
            </Alert>
          ) : (
            <>
              <Typography variant="body2">
                Families will be able to choose from this menu. Confirm the food transcription,
                lunch rules, breakfast offering, no-school dates, and EDP schedule with the school.
              </Typography>
              <FormControlLabel
                sx={{ mt: 2 }}
                label="I have reviewed this menu and its service schedules."
                control={
                  <Checkbox checked={reviewed} onChange={(e) => setReviewed(e.target.checked)} />
                }
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPublishOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!reviewed || !!issues.length || busy}
            onClick={() => menu && void persist({ ...menu, status: 'published' })}
          >
            Publish reviewed menu
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
export function DayEditor({
  day,
  categories,
  onChange,
}: {
  day: MenuDay;
  categories: MenuCategory[];
  onChange: (day: MenuDay) => void;
}) {
  const updateOption = (next: MenuOption) =>
    onChange({ ...day, options: day.options.map((o) => (o.id === next.id ? next : o)) });
  const addOption = (mealType: MealType) => {
    const category =
      categories.find((c) => c.meal_type === mealType && c.selection_mode !== 'informational') ||
      categories.find((c) => c.meal_type === mealType);
    if (!category) return;
    onChange({
      ...day,
      options: [
        ...day.options,
        {
          id: crypto.randomUUID(),
          menu_day_id: day.id,
          menu_category_id: category.id,
          meal_type: mealType,
          name: 'New option',
          description: '',
          dietary_label: '',
          unavailable: false,
          sort_order: day.options.length,
        },
      ],
    });
  };
  return (
    <Box
      sx={{ p: { xs: 2, md: 3 }, bgcolor: 'white', border: '1px solid #e3e6dd', borderRadius: 3 }}
    >
      <Typography variant="h2" sx={{ fontSize: 27, mb: 2 }}>
        {dateLabel(day.service_date)}
      </Typography>
      <FormControlLabel
        label="No school on this date"
        control={
          <Checkbox
            checked={day.no_school}
            onChange={(e) =>
              onChange({
                ...day,
                no_school: e.target.checked,
                lunch_available: !e.target.checked,
                breakfast_available: false,
                edp_available: e.target.checked ? false : null,
              })
            }
          />
        }
      />
      <TextField
        size="small"
        label="Day note"
        value={day.note}
        onChange={(e) => onChange({ ...day, note: e.target.value })}
        sx={{ mb: 2 }}
      />
      {!day.no_school && (
        <>
          {(['lunch', 'breakfast'] as const).map((type) => (
            <Box key={type} sx={{ mt: 2, pt: 2, borderTop: '1px solid #e4e6dd' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h3" sx={{ textTransform: 'capitalize' }}>
                  {type}
                </Typography>
                <FormControlLabel
                  label="Enabled"
                  control={
                    <Checkbox
                      checked={type === 'lunch' ? day.lunch_available : day.breakfast_available}
                      onChange={(e) =>
                        onChange({ ...day, [`${type}_available`]: e.target.checked })
                      }
                    />
                  }
                />
              </Box>
              {type === 'breakfast' && (
                <TextField
                  select
                  size="small"
                  label="Breakfast request type"
                  value={day.breakfast_mode}
                  onChange={(e) =>
                    onChange({
                      ...day,
                      breakfast_mode: e.target.value as MenuDay['breakfast_mode'],
                    })
                  }
                  sx={{ my: 1 }}
                >
                  <MenuItem value="opt_in">Participation only</MenuItem>
                  <MenuItem value="choices">Choose specific items</MenuItem>
                </TextField>
              )}
              {day.options
                .filter((o) => o.meal_type === type)
                .map((option) => (
                  <Box
                    key={option.id}
                    sx={{
                      bgcolor: '#f8f9f4',
                      p: 2,
                      borderRadius: 2,
                      my: 2,
                      display: 'grid',
                      gap: 1.5,
                    }}
                  >
                    <TextField
                      size="small"
                      label="Option name"
                      value={option.name}
                      onChange={(e) => updateOption({ ...option, name: e.target.value })}
                    />
                    <TextField
                      size="small"
                      label="Description / included sides"
                      value={option.description}
                      onChange={(e) => updateOption({ ...option, description: e.target.value })}
                    />
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <TextField
                        select
                        size="small"
                        label="Category"
                        value={option.menu_category_id}
                        onChange={(e) =>
                          updateOption({ ...option, menu_category_id: e.target.value })
                        }
                        sx={{ flex: 1, minWidth: 150 }}
                      >
                        {categories
                          .filter((c) => c.meal_type === type)
                          .map((c) => (
                            <MenuItem key={c.id} value={c.id}>
                              {c.name}
                            </MenuItem>
                          ))}
                      </TextField>
                      <TextField
                        size="small"
                        label="Source dietary label"
                        value={option.dietary_label}
                        onChange={(e) => updateOption({ ...option, dietary_label: e.target.value })}
                        sx={{ flex: 1, minWidth: 150 }}
                      />
                      <FormControlLabel
                        label="Unavailable"
                        control={
                          <Checkbox
                            checked={option.unavailable}
                            onChange={(e) =>
                              updateOption({ ...option, unavailable: e.target.checked })
                            }
                          />
                        }
                      />
                    </Box>
                  </Box>
                ))}
              <Button
                startIcon={<AddIcon />}
                disabled={!categories.some((c) => c.meal_type === type)}
                onClick={() => addOption(type)}
              >
                Add {type} option
              </Button>
            </Box>
          ))}
          <Divider sx={{ my: 3 }} />
          <Typography variant="h3" sx={{ mb: 2 }}>
            Extended Day Program
          </Typography>
          <TextField
            select
            size="small"
            label="EDP availability"
            value={day.edp_available === null ? 'unknown' : day.edp_available ? 'yes' : 'no'}
            onChange={(e) =>
              onChange({
                ...day,
                edp_available: e.target.value === 'unknown' ? null : e.target.value === 'yes',
              })
            }
          >
            <MenuItem value="unknown">Awaiting confirmation</MenuItem>
            <MenuItem value="yes">Available</MenuItem>
            <MenuItem value="no">Unavailable</MenuItem>
          </TextField>
          <TextField
            size="small"
            label="EDP hours / note"
            value={day.edp_note}
            onChange={(e) => onChange({ ...day, edp_note: e.target.value })}
            sx={{ mt: 2 }}
          />
        </>
      )}
    </Box>
  );
}
