import { useEffect, useState } from "react";

import axios from "axios";

import {

  Grid,

  Paper,

  Typography,

  Box

} from "@mui/material";

import {

  PieChart,

  Pie,

  Cell,

  Tooltip,

  ResponsiveContainer,

  BarChart,

  Bar,

  XAxis,

  YAxis,

  CartesianGrid

} from "recharts";



import PageLoader from "../PageLoader";

import {

  GuidancePanel,

  ServerErrorAlert,

  GUIDANCE,

  getGuidanceForMissing

} from "../GuidancePanel";



import { classifyApiError } from "../../utils/apiErrors";

import {

  getMissingForPage,

  resolveUserContext

} from "../../utils/userContext";



export default function RiskDashboard() {



  const [risk, setRisk] = useState(null);



  const [allocation,

    setAllocation] = useState(null);



  const [diversification,

    setDiversification] = useState(null);



  const [profile,

    setProfile] = useState(null);



  const [loading, setLoading] =

    useState(true);



  const [error, setError] =

    useState(null);



  const [guidance, setGuidance] =

    useState(null);



  useEffect(() => {

    loadData();

  }, []);



  const loadData = async () => {

    setLoading(true);

    setError(null);

    setGuidance(null);



    try {

      const context =

        await resolveUserContext();



      const missing =

        getMissingForPage(

          "risk",

          context

        );



      if (missing.length) {

        if (

          missing[0] === "profile" &&

          context.hasPortfolio &&

          context.hasAssets

        ) {

          setGuidance(

            GUIDANCE.profileRequiredRisk

          );

        } else {

          setGuidance(

            getGuidanceForMissing(missing)

          );

        }

        return;

      }



      const activePortfolioId =

        context.portfolio.id;



      const profileId =

        context.profile.id;



    console.log(

      "Risk Portfolio ID:",

      activePortfolioId

    );



    const results = await Promise.all([

      axios.get(

        `http://127.0.0.1:8000/risk/portfolio/${activePortfolioId}`

      ),

      axios.get(

        `http://127.0.0.1:8000/risk/allocation/${activePortfolioId}`

      ),

      axios.get(

        `http://127.0.0.1:8000/risk/diversification/${activePortfolioId}`

      ),

      axios.get(

        `http://127.0.0.1:8000/risk/profile/${profileId}`

      )

    ]);



    setRisk(results[0].data);

    setAllocation(results[1].data);

    setDiversification(results[2].data);

    setProfile(results[3].data);



  } catch (err) {



    console.error(

      "Risk Dashboard Error:",

      err

    );



    const classified =

      classifyApiError(err);



    if (classified.type === "missing") {

      setGuidance(

        getGuidanceForMissing(["profile"])

      );

    } else {

      setError(classified.message);

    }



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



  const allocationData = allocation

  ? [

      {

        name: "Equity",

        value: allocation.equity

      },

      {

        name: "Debt",

        value: allocation.debt

      },

      {

        name: "Cash",

        value: allocation.cash

      }

    ]

  : [];



const riskMetricsData = risk

  ? [

      {

        metric: "Volatility",

        value: risk.volatility

      },

      {

        metric: "Sharpe",

        value: risk.sharpe_ratio

      },

      {

        metric: "Drawdown",

        value: Math.abs(risk.max_drawdown)

      },

      {

        metric: "Beta",

        value: risk.beta

      }

    ]

  : [];



const COLORS = [

  "#3B82F6",

  "#22C55E",

  "#F59E0B"

];



if (loading) {

  return (

    <>

      <PageLoader message="Loading risk analysis..." />

    </>

  );

}



if (error) {



  return (

    <>

      <ServerErrorAlert message={error} />

    </>

  );



}



if (guidance) {

  return (

    <>

      <GuidancePanel {...guidance} />

    </>

  );

}



  return (

    <>

      <Typography

        variant="h4"

        fontWeight={700}

        mb={4}

      >

        Risk Dashboard

      </Typography>



      <Grid container spacing={3}>

        <Grid  xs={12} md={3}>

          <Paper sx={cardStyle}>

            <Typography color="gray">

              Volatility

            </Typography>



            <Typography

              variant="h4"

              fontWeight={700}

            >

              {risk?.volatility ?? "--"}

            </Typography>

          </Paper>

        </Grid>



        <Grid  xs={12} md={3}>

          <Paper sx={cardStyle}>

            <Typography color="gray">

              Sharpe Ratio

            </Typography>



            <Typography

              variant="h4"

              fontWeight={700}

            >

              {risk?.sharpe_ratio ?? "--"}

            </Typography>

          </Paper>

        </Grid>



        <Grid  xs={12} md={3}>

          <Paper sx={cardStyle}>

            <Typography color="gray">

              Max Drawdown

            </Typography>



            <Typography

              variant="h4"

              fontWeight={700}

            >

              {risk?.max_drawdown ?? "--"}

            </Typography>

          </Paper>

        </Grid>



        <Grid  xs={12} md={3}>

          <Paper sx={cardStyle}>

            <Typography color="gray">

              Beta

            </Typography>



            <Typography

              variant="h4"

              fontWeight={700}

            >

              {risk?.beta ?? "--"}

            </Typography>

          </Paper>

        </Grid>

      </Grid>



      <Grid

        container

        spacing={3}

        mt={1}

      >

        <Grid xs={12} md={6}>

          <Paper sx={cardStyle}>

  <Typography

    variant="h6"

    mb={2}

  >

    Asset Allocation

  </Typography>



  <ResponsiveContainer

    width="100%"

    height={300}

  >

    <PieChart>

      <Pie

        data={allocationData}

        dataKey="value"

        nameKey="name"

        outerRadius={100}

        label

      >

        {allocationData.map(

          (entry, index) => (

            <Cell

              key={index}

              fill={

                COLORS[

                  index %

                    COLORS.length

                ]

              }

            />

          )

        )}

      </Pie>



      <Tooltip />

    </PieChart>

  </ResponsiveContainer>

</Paper>

        </Grid>



        <Grid xs={12} md={6}>

          <Paper sx={cardStyle}>

  <Typography

    variant="h6"

    mb={2}

  >

    Risk Metrics Overview

  </Typography>



  <ResponsiveContainer

    width="100%"

    height={250}

  >

    <BarChart

      data={riskMetricsData}

    >

      <CartesianGrid

        strokeDasharray="3 3"

      />



      <XAxis

        dataKey="metric"

      />



      <YAxis />



      <Tooltip />



      <Bar

        dataKey="value"

        fill="#3B82F6"

      />

    </BarChart>

  </ResponsiveContainer>



  <Box mt={3}>

    <Typography>

      Diversification Score:

      {" "}

      {diversification?.score}

    </Typography>



    <Typography>

      Rating:

      {" "}

      {diversification?.rating}

    </Typography>



    <Typography mt={2}>

      Risk Score:

      {" "}

      {profile?.risk_score}

    </Typography>





    <Box mt={2}>

  <Typography>

    Risk Profile

  </Typography>



  <Box

    sx={{

      display: "inline-block",

      px: 2,

      py: 1,

      mt: 1,

      borderRadius: 2,

      bgcolor:

        profile?.risk_profile === "Aggressive"

          ? "#EF4444"

          : "#22C55E",

      color: "white",

      fontWeight: 700

    }}

  >

    {profile?.risk_profile}

  </Box>

</Box>

  </Box>

</Paper>

        </Grid>

      </Grid>

    </>

  );

}


