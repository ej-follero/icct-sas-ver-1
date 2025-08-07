import PageHeader from '@/components/PageHeader/PageHeader';

interface AttendanceHeaderProps {
  title: string;
  subtitle: string;
}

export default function AttendanceHeader({ title, subtitle }: AttendanceHeaderProps) {
  return (
    <PageHeader
      title={title}
      subtitle={subtitle}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Attendance Management', href: '/attendance' },
        { label: 'Students' }
      ]}
    />
  );
} 