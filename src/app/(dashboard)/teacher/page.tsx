import CalendarView from "@/components/CalendarView";
import { Container, Grid, Paper, Typography } from "@mui/material";
import { calendarEvents } from "@/lib/data";

const TeacherPage = () => {
  return (
    <Container>
      <Grid container spacing={4}>
        <Grid item xs={12}>
          <Paper elevation={3} className="p-4">
            <Typography variant="h5" component="h1" gutterBottom>
              Schedule
            </Typography>
            <CalendarView mode="work-week" events={calendarEvents} />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default TeacherPage;
