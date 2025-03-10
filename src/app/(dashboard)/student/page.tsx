import Announcements from "@/components/Announcements";
import BigCalendar from "@/components/BigCalendar";
import EventCalendar from "@/components/EventCalendar";
import { Container, Grid, Paper, Typography } from "@mui/material";

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
            <BigCalendar />
          </Paper>
        </Grid>
        {/* RIGHT */}
        <Grid item xs={12} xl={4}>
          <Grid container spacing={4} direction="column">
            <Grid item>
              <EventCalendar />
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