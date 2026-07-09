import { useEffect, useState } from "react";



import {

  Box,

  Chip

} from "@mui/material";



import SummaryCard from "../SummaryCard";

import PageLoader from "../PageLoader";

import {

  GuidancePanel,

  ServerErrorAlert,

  getGuidanceForMissing

} from "../GuidancePanel";



import GoalProbabilityWidget from "../GoalProbabilityWidget";

import MonteCarloWidget from "../MonteCarloWidget";

import EfficientFrontierWidget from "../EfficientFrontierWidget";

import FactorExposureWidget from "../FactorExposureWidget";



import {

  getRiskProfile

} from "../../services/riskService";



import {

  getGoalProbability,

  getMonteCarlo,

  getGoals

} from "../../services/analyticsService";

import {

  resolveUserProfile

} from "../../utils/currentUser";

import { classifyApiError } from "../../utils/apiErrors";

import {

  getMissingForPage,

  resolveUserContext

} from "../../utils/userContext";



export default function AnalyticsPage() {



  const [riskProfile,

    setRiskProfile] = useState(null);



  const [goalProbability,

    setGoalProbability] = useState(null);



  const [monteCarlo,

    setMonteCarlo] = useState(null);



  const [loading, setLoading] =

    useState(true);



  const [error, setError] =

    useState(null);



  const [guidance, setGuidance] =

    useState(null);



  useEffect(() => {

    loadAnalytics();

  }, []);



  const loadAnalytics = async () => {

    setLoading(true);

    setError(null);

    setGuidance(null);



    try {

      const context =

        await resolveUserContext();



      const missing =

        getMissingForPage(

          "analytics",

          context

        );



      if (missing.length) {

        setGuidance(

          getGuidanceForMissing(missing)

        );

        return;

      }



      const profile =

        await resolveUserProfile();



      if (profile) {

        const goals =

          await getGoals();



        const [userGoal] = goals;



        if (userGoal) {

          const targetYear =

            new Date(

              userGoal.target_date

            ).getFullYear();



          const currentYear =

            new Date().getFullYear();



          const years =

            Math.max(

              1,

              targetYear - currentYear

            );



          const profileId = profile.id;



          const [

            riskData,

            goalData,

            monteData

          ] = await Promise.all([



            getRiskProfile(

              profileId

            ),



            getGoalProbability({

              current_value:

                Math.max(

                  1,

                  userGoal.current_amount

                ),



              monthly_contribution:

                userGoal.monthly_contribution,



              expected_return: 12,



              volatility: 15,



              years,



              target_amount:

                userGoal.target_amount,



              simulations: 1000

            }),



            getMonteCarlo(

              profileId,

              {

                initial_amount:

                  Math.max(

                    1,

                    userGoal.current_amount

                  ),



                monthly_contribution:

                  userGoal.monthly_contribution,



                years,



                simulations: 1000

              }

            )



          ]);



          setRiskProfile(

            riskData

          );



          setGoalProbability(

            goalData.probability

          );



          setMonteCarlo(

            monteData

          );

        }

      }



    } catch (err) {

      console.error(

        "Analytics Error:",

        err

      );



      setError(

        classifyApiError(err).message

      );

    } finally {

      setLoading(false);

    }

  };



  if (loading) {

    return (

      <>

        <PageLoader message="Loading analytics..." />

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



      <Box

        sx={{

          mb: 4,

          display: "flex",

          gap: 2,

          flexWrap: "wrap"

        }}

      >

        <Chip

          label="Portfolio Health: Good"

          color="success"

        />



        <Chip

          label="Analytics Modules: 4 Active"

          color="primary"

        />



        <Chip

          label="Status: Live"

          color="secondary"

        />

      </Box>



      <Box

        sx={{

          display: "grid",

          gridTemplateColumns: {

            xs: "1fr",

            sm: "repeat(2,1fr)",

            lg: "repeat(4,1fr)"

          },

          gap: 3,

          mb: 3

        }}

      >



        <SummaryCard

          title="Portfolio Value"

          value={

            monteCarlo

              ? `$${Math.round(

                  monteCarlo.median_value

                ).toLocaleString()}`

              : "--"

          }

          subtitle="Projected Median Value"

        />



        <SummaryCard

          title="Expected Return"

          value={

            monteCarlo

              ? `${monteCarlo.expected_return}%`

              : "--"

          }

          subtitle="Annualized Return"

        />



        <SummaryCard

          title="Risk Score"

          value={

            riskProfile

              ? riskProfile.risk_score

              : "--"

          }

          subtitle={

            riskProfile

              ? riskProfile.risk_profile

              : "Risk Profile"

          }

        />



        <SummaryCard

          title="Goal Success"

          value={

            goalProbability !== null

              ? `${goalProbability}%`

              : "--"

          }

          subtitle="Goal Achievement Probability"

        />



      </Box>



      <Box sx={{ mb: 2 }}>

        <EfficientFrontierWidget />

      </Box>



      <Box

        sx={{

          display: "grid",

          gridTemplateColumns: {

            xs: "1fr",

            md: "1fr 1fr"

          },

          gap: 2,

          mb: 2

        }}

      >

        <GoalProbabilityWidget />



        <FactorExposureWidget />

      </Box>



      <Box sx={{ mb: 2 }}>

        <MonteCarloWidget />

      </Box>





    </>

  );

}


