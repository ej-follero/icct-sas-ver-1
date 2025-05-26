import Announcements from "@/components/Announcements";
import CalendarView from "@/components/CalendarView";
import { Container, Grid, Paper, Typography } from "@mui/material";
import { calendarEvents } from "@/lib/data";

const StudentPage = () => {
  return (
    <Container>
      <Grid container spacing={4}>
        {/* LEFT */}
        <Grid item xs={12} xl={8}>
          <Paper elevation={3} className="p-4">
            <Typography variant="h5" component="h1" gutterBottom>
              Schedule (Section)
            </Typography>
            <CalendarView mode="work-week" events={calendarEvents} />
          </Paper>
        </Grid>
        {/* RIGHT */}
        <Grid item xs={12} xl={4}>
          <Grid container spacing={4} direction="column">
            <Grid item>
              <CalendarView 
                mode="month" 
                events={calendarEvents} 
                showEventCards={true}
                className="h-[600px]"
              />
            </Grid>
            <Grid item>
              <Announcements />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Container>
  );
};

export default StudentPage;