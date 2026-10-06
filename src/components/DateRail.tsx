import { useEffect, useRef } from 'react';
import { Box, ButtonBase, Typography } from '@mui/material';
import { format, parseISO } from 'date-fns';
import CheckIcon from '@mui/icons-material/Check';
import RemoveIcon from '@mui/icons-material/Remove';
import { completion, dateLabel, todayInSchool } from '../utils/plans';
import type { DailyRequest, MenuMonth } from '../types/domain';

export function DateRail({
  month,
  selectedId,
  requests,
  onSelect,
}: {
  month: MenuMonth;
  selectedId: string;
  requests: DailyRequest[];
  onSelect: (id: string) => void;
}) {
  const selectedRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    selectedRef.current?.scrollIntoView({
      block: 'nearest',
      inline: 'center',
      behavior: 'instant',
    });
  }, [selectedId]);
  const today = todayInSchool();
  return (
    <Box className="date-rail" role="group" aria-label="School dates">
      {month.days.map((day) => {
        const state = completion(
          day,
          requests.find((r) => r.menu_day_id === day.id),
          month.categories,
        );
        const selected = selectedId === day.id;
        const isToday = today === day.service_date;
        return (
          <ButtonBase
            key={day.id}
            ref={selected ? selectedRef : undefined}
            onClick={() => onSelect(day.id)}
            aria-pressed={selected}
            aria-label={`${dateLabel(day.service_date)}${isToday ? ', today' : ''}, ${state.label}`}
            sx={{
              width: 66,
              minHeight: 96,
              borderRadius: 3,
              bgcolor: selected ? 'primary.main' : 'white',
              color: selected ? 'white' : day.no_school ? '#70796f' : 'text.primary',
              border: selected ? '1px solid #244b3e' : '1px solid #e3e6dd',
              flexDirection: 'column',
              gap: 0.3,
            }}
          >
            <Typography sx={{ fontSize: 10, letterSpacing: 1.3, fontWeight: 600 }}>
              {format(parseISO(day.service_date), 'EEE').toUpperCase()}
            </Typography>
            <Typography sx={{ fontSize: 24, lineHeight: 1.3, fontWeight: 600 }}>
              {format(parseISO(day.service_date), 'd')}
            </Typography>
            <Box sx={{ height: 18, display: 'flex', alignItems: 'center' }}>
              {day.no_school ? (
                <RemoveIcon sx={{ fontSize: 15 }} />
              ) : state.state === 'complete' ? (
                <CheckIcon sx={{ fontSize: 15 }} />
              ) : (
                <Box
                  sx={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    bgcolor: selected ? '#f0dc91' : '#adb7a9',
                  }}
                />
              )}
            </Box>
            {isToday && (
              <Typography sx={{ fontSize: 8, fontWeight: 700, lineHeight: 1 }}>TODAY</Typography>
            )}
          </ButtonBase>
        );
      })}
    </Box>
  );
}
