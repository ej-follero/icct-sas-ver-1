import { Chip, ChipProps } from "@mui/material";

type StatusType = 'active' | 'inactive' | 'present' | 'absent' | 'late' | 'excused' | 'on_leave';

interface StatusBadgeProps extends Omit<ChipProps, 'label' | 'color'> {
  status: StatusType;
  showLabel?: boolean;
}

const statusConfig: Record<StatusType, { label: string; color: ChipProps['color'] }> = {
  active: { label: 'Active', color: 'success' },
  inactive: { label: 'Inactive', color: 'error' },
  present: { label: 'Present', color: 'success' },
  absent: { label: 'Absent', color: 'error' },
  late: { label: 'Late', color: 'warning' },
  excused: { label: 'Excused', color: 'info' },
  on_leave: { label: 'On Leave', color: 'info' },
};

export function StatusBadge({ status, showLabel = true, ...props }: StatusBadgeProps) {
  const config = statusConfig[status.toLowerCase() as StatusType] || statusConfig.inactive;

  return (
    <Chip
      label={showLabel ? config.label : status}
      color={config.color}
      size="small"
      variant="outlined"
      sx={{
        minWidth: 80,
        fontWeight: 500,
        '& .MuiChip-label': {
          px: 1,
        },
        ...props.sx,
      }}
      {...props}
    />
  );
} 