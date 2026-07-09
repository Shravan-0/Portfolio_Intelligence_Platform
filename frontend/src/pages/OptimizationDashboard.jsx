import { useEffect, useState } from "react";

import axios from "axios";



import {

  Grid,

  Paper,

  Button,

  Typography,

  Box,

  List,

  ListItem,

  ListItemText,

  Divider,

  Table,

  TableBody,

  TableCell,

  TableHead,

  TableRow

} from "@mui/material";



import DashboardLayout from "../layouts/DashboardLayout";

import PageLoader from "../components/PageLoader";

import {

  GuidanceAlert,

  GuidancePanel,

  ServerErrorAlert,

  GUIDANCE,

  getGuidanceForMissing

} from "../components/GuidancePanel";

import {

  CircularProgressbar,

  buildStyles,

} from "react-circular-progressbar";

import "react-circular-progressbar/dist/styles.css";

import {

  getBenchmarkComparison

} from "../services/performanceService";

import { classifyApiError } from "../utils/apiErrors";

import {

  getMissingForPage,

  resolveUserContext

} from "../utils/userContext";



export default function OptimizationDashboard() {

 const [health, setHealth] = useState(null);

const [rebalance, setRebalance] = useState(null);

const [recommendations, setRecommendations] = useState([]);



const [benchmark, setBenchmark] = useState(null);

const [correlation, setCorrelation] = useState(null);

const [loading, setLoading] =

  useState(true);



const [error, setError] =

  useState(null);



const [guidance, setGuidance] =

  useState(null);



const [reportBlocked, setReportBlocked] =

  useState(false);



  useEffect(() => {

    loadData();

  }, []);

  const [reportLoading,

       setReportLoading] =

  useState(false);



const [portfolioId,

  setPortfolioId] =

  useState(null);



const downloadReport =

  async () => {



    if (!portfolioId) {

      return;

    }



    setReportLoading(true);



    try {

      await axios.get(

        `http://127.0.0.1:8000/report/portfolio/${portfolioId}`

      );



      window.location.href =

  `http://127.0.0.1:8000/report/download/${portfolioId}`;



    } finally {



      setTimeout(() => {

        setReportLoading(false);

      }, 1000);



    }

};

const loadData = async () => {

  setLoading(true);

  setError(null);

  setGuidance(null);

  setReportBlocked(false);



  try {



    console.log(

      "Loading Optimization Data..."

    );



    const context =

      await resolveUserContext();



    const missing =

      getMissingForPage(

        "optimization",

        context

      );



    if (missing.length) {

      setGuidance(

        getGuidanceForMissing(missing)

      );

      return;

    }



    const activePortfolioId =

      context.portfolio.id;



    const activeProfileId =

      context.profile.id;



    setPortfolioId(

      activePortfolioId

    );



    const reportMissing =

      getMissingForPage(

        "reports",

        context

      );



    setReportBlocked(

      reportMissing.length > 0

    );



    console.log(

      "Optimization Portfolio ID:",

      activePortfolioId

    );



    const benchmarkRequest =

      getBenchmarkComparison(

        activePortfolioId

      ).then((data) => ({

        data: {

          ...data,

          status:

            data.alpha >= 0

              ? "Outperforming"

              : "Underperforming"

        }

      }));



    const results = await Promise.all([

      axios.get(

        `http://127.0.0.1:8000/optimization/health/${activePortfolioId}`

      ),

      benchmarkRequest,

      axios.get(

        `http://127.0.0.1:8000/analytics/correlation/${activePortfolioId}`

      ),

      axios.get(

        `http://127.0.0.1:8000/optimization/rebalance/${activeProfileId}`

      ),

      axios.get(

        `http://127.0.0.1:8000/optimization/recommendations/${activeProfileId}`

      ),

    ]);



    setHealth(results[0].data);

    setBenchmark(results[1].data);

    setCorrelation(results[2].data);

    setRebalance(results[3].data);

    setRecommendations(

      results[4].data.recommendations

    );



    } catch (err) {

  console.error(

    "Optimization Dashboard Error:",

    err

  );



  setError(

    classifyApiError(err).message

  );

} finally {

  setLoading(false);

}

  };



  const cardStyle = {

    bgcolor: "#131C2F",

    p: 3,

    borderRadius: 3,

    height: "100%"

  };



  const getHealthColor = () => {

    if (!health) return "#64748B";



    if (health.rating === "Excellent")

      return "#22C55E";



    if (health.rating === "Strong")

      return "#3B82F6";



    if (health.rating === "Moderate")

      return "#F59E0B";



    return "#EF4444";

  };



  if (loading) {

    return (

      <DashboardLayout>

        <PageLoader message="Loading optimization..." />

      </DashboardLayout>

    );

  }



  if (error) {

  return (

    <DashboardLayout>

      <ServerErrorAlert message={error} />

    </DashboardLayout>

  );

}



if (guidance) {

  return (

    <DashboardLayout>

      <GuidancePanel {...guidance} />

    </DashboardLayout>

  );

}



  return (

    <DashboardLayout>

      <Typography

        variant="h4"

        fontWeight={700}

        mb={4}

      >

        Optimization Dashboard

      </Typography>



      <Box mb={3}>

        {reportBlocked ? (

          <GuidanceAlert severity="warning">

            <Typography fontWeight={600} mb={0.5}>

              {GUIDANCE.reportsNotReady.title}

            </Typography>

            {GUIDANCE.reportsNotReady.message}

          </GuidanceAlert>

        ) : null}





</Box>



      <Grid container spacing={3}>

        <Grid  xs={12}>

          <Paper sx={cardStyle}>

            <Typography

              variant="h6"

              color="gray"

            >

              Portfolio Health Score

            </Typography>



            <Box

  sx={{

    width: 220,

    height: 220,

    mx: "auto",

    mt: 3,

  }}

>

  <CircularProgressbar

    value={health?.health_score || 0}

    text={`${health?.health_score || 0}`}

    styles={buildStyles({

      textColor: getHealthColor(),

      pathColor: getHealthColor(),

      trailColor: "#1E293B",

    })}

  />

</Box>



<Typography

  variant="h6"

  sx={{

    textAlign: "center"

  }}

  mt={2}

>

  {health?.rating}

</Typography>

          </Paper>

        </Grid>



        <Grid xs={12}>

  <Paper sx={cardStyle}>

    <Typography

      variant="h6"

      mb={3}

    >

      Benchmark Comparison

    </Typography>



    <Typography>

      Portfolio Return:

      {" "}

      {benchmark?.portfolio_return}%

    </Typography>



    <Typography>

      Benchmark:

      {" "}

      {benchmark?.benchmark}

    </Typography>



    <Typography>

      Benchmark Return:

      {" "}

      {benchmark?.benchmark_return}%

    </Typography>



    <Typography>

      Alpha:

      {" "}

      {benchmark?.alpha}%

    </Typography>



    <Typography

      mt={2}

      color="#22C55E"

      fontWeight={700}

    >

      {benchmark?.status}

    </Typography>

  </Paper>

</Grid> 



<Grid xs={12}>

  <Paper sx={cardStyle}>

    <Typography

      variant="h6"

      mb={3}

    >

      Correlation Matrix

    </Typography>



    {correlation &&
 correlation.matrix &&
 Object.keys(correlation.matrix).length > 1 ? (

  <Table>
    ...
  </Table>

) : (

  <Box
    sx={{
      py: 8,
      textAlign: "center",
    }}
  >
    <Typography
      variant="h6"
      color="#94A3B8"
      gutterBottom
    >
      Correlation Matrix Unavailable
    </Typography>

    <Typography color="#64748B">
      Add at least two portfolio assets to calculate
      asset correlations.
    </Typography>
  </Box>

)}

  </Paper>

</Grid>



        <Grid  xs={12} md={6}>

          <Paper sx={cardStyle}>

            <Typography

              variant="h6"

              mb={3}

            >

              Current Allocation

            </Typography>



            <Typography>

              Equity:

              {" "}

              {rebalance?.current_equity ?? 0}%

            </Typography>



            <Typography>

              Debt:

              {" "}

              {rebalance?.current_debt ?? 0}%

            </Typography>



            <Typography>

              Cash:

              {" "}

              {rebalance?.current_cash ?? 0}%

            </Typography>

          </Paper>

        </Grid>



        <Grid  xs={12} md={6}>

          <Paper sx={cardStyle}>

            <Typography

              variant="h6"

              mb={3}

            >

              Recommended Allocation

            </Typography>



            <Typography>

              Equity:

              {" "}

              {rebalance?.recommended_equity ?? 0}%

            </Typography>



            <Typography>

              Debt:

              {" "}

              {rebalance?.recommended_debt ?? 0}%

            </Typography>



            <Typography>

              Cash:

              {" "}

              {rebalance?.recommended_cash ?? 0}%

            </Typography>



            <Box mt={3}>

              <Typography

                color="#3B82F6"

                fontWeight={600}

              >

                {rebalance?.action}

              </Typography>

            </Box>

          </Paper>

        </Grid>



        <Grid  xs={12}>

          <Paper sx={cardStyle}>

            <Typography

              variant="h6"

              mb={2}

            >

              Optimization Recommendations

            </Typography>



            <List>

              {recommendations.map(

                (item, index) => (

                  <Box key={index}>

                    <ListItem>

                      <ListItemText

                        primary={item}

                      />

                    </ListItem>



                    {index !==

                      recommendations.length -

                        1 && (

                      <Divider />

                    )}

                  </Box>

                )

              )}

            </List>

          </Paper>

        </Grid>



      </Grid>

    </DashboardLayout>

  );

}


