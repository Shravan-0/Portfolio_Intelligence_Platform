import {
  useState,
  useEffect
} from "react";
import {
  createProfile,
  getProfiles,
  updateProfile
} from "../services/profileService";
import {
  Typography,
  Paper,
  TextField,
  MenuItem,
  Button,
  Grid,
  Box,
  Divider,
  Snackbar,
  Alert
} from "@mui/material";

import DashboardLayout from "../layouts/DashboardLayout";
import PageLoader from "../components/PageLoader";
import {
  ServerErrorAlert
} from "../components/GuidancePanel";
import { classifyApiError } from "../utils/apiErrors";

import {
  createGoal
} from "../services/goalService";

import {
  getGoals
} from "../services/analyticsService";


export default function ProfilePage() {
  const [profileId,
  setProfileId] =
  useState(null);
  const [goalId,setGoalId] =
  useState(null);
  const [goalType, setGoalType] = useState("");
  const [customGoal, setCustomGoal] = useState("");

  const [targetAmount, setTargetAmount] =
    useState("");

  const [targetDate, setTargetDate] =
    useState("");

  const [currentSavings, setCurrentSavings] =
    useState("");

  const [monthlyInvestment, setMonthlyInvestment] =
    useState("");

  const [age, setAge] =
    useState("");

  const [annualIncome, setAnnualIncome] =
    useState("");

  const [investmentHorizon,
    setInvestmentHorizon] = useState("");

  const [riskTolerance,
    setRiskTolerance] = useState("");

    const [loading, setLoading] =
  useState(true);

const [error, setError] =
 useState(null);



const [snackbar, setSnackbar] = useState({
  open: false,
  message: "",
  severity: "success"
});

const today = new Date();

const minDate = new Date(
  today.getFullYear() + 1,
  today.getMonth(),
  1
);

const [submitting, setSubmitting] = useState(false);
const minGoalDate =
  `${minDate.getFullYear()}-${String(
    minDate.getMonth() + 1
  ).padStart(2, "0")}`;



const loadProfile = async () => {

  try {

    const profiles =
      await getProfiles();

    const userId =
      Number(
        localStorage.getItem(
          "userId"
        )
      );

    const profile =
      profiles.find(
        (p) =>
          p.user_id === userId
      );

    if (!profile) {
      return;
    }

    setProfileId(
      profile.id
    );

    setAge(
      profile.age
    );

    setAnnualIncome(
      profile.annual_income
    );

    setInvestmentHorizon(
      profile.investment_horizon
    );

    setTargetAmount(
      profile.target_amount
    );

    setRiskTolerance(
      profile.risk_tolerance
    );

  } catch (error) {

    console.error(
      "Load Profile Error:",
      error
    );

    if (
      error.code === "ERR_NETWORK" ||
      !error.response
    ) {

      setError(
        classifyApiError(error).message
      );

    }

  }

};

const loadGoal = async () => {

  try {

    const goals =
      await getGoals();

    const [userGoal] = goals;

    if (!userGoal) {
      return;
    }

    setGoalId(
      userGoal.id
    );

    setGoalType(
      userGoal.goal_type
    );

    setTargetAmount(
      userGoal.target_amount
    );

    setTargetDate(
      userGoal.target_date
        .substring(0, 7)
    );

    setCurrentSavings(
      userGoal.current_amount != null
        ? String(userGoal.current_amount)
        : ""
    );

    setMonthlyInvestment(
      userGoal.monthly_contribution != null
        ? String(userGoal.monthly_contribution)
        : ""
    );

    if (
      userGoal.goal_type ===
      "Other"
    ) {

      setCustomGoal(
        userGoal.goal_name
      );

    }

  } catch (error) {

    console.error(
      "Load Goal Error:",
      error
    );

    setError(
      classifyApiError(error).message
    );

  } finally {

    setLoading(false);

  }

};


useEffect(() => {
  setTimeout(() => {
    loadProfile();
    loadGoal();
  }, 0);
}, []);

const showNotification = (
  message,
  severity = "success"
) => {
  setSnackbar({
    open: true,
    message,
    severity
  });
};

const handleSnackbarClose = () => {
  setSnackbar((prev) => ({
    ...prev,
    open: false
  }));
};

const handleSubmit = async () => {
  const profilePayload = {
    user_id: Number(localStorage.getItem("userId")),
    age: Number(age),
    annual_income: Number(annualIncome),
    investment_horizon: Number(investmentHorizon),
    target_amount: Number(targetAmount),
    risk_tolerance: riskTolerance
  };

  const selectedDate = new Date(`${targetDate}-01`);

  const today = new Date();

  const minimumDate = new Date(
    today.getFullYear() + 1,
    today.getMonth(),
    1
  );

  if (selectedDate < minimumDate) {
    showNotification(
      "Target date must be at least one year ahead.",
      "warning"
    );
    return;
  }

  const goalPayload = {
    user_id: Number(localStorage.getItem("userId")),

    goal_type: goalType,

    goal_name:
      goalType === "Other"
        ? customGoal
        : goalType,

    target_amount: Number(targetAmount),

    target_date: `${targetDate}-01`,

    current_amount:
      currentSavings === ""
        ? 0
        : Number(currentSavings),

    monthly_contribution:
      monthlyInvestment === ""
        ? 0
        : Number(monthlyInvestment),

    annual_income:
      annualIncome === ""
        ? 0
        : Number(annualIncome)
  };

  if (Number(age) < 18 || Number(age) > 100) {
    showNotification(
      "Age must be between 18 and 100.",
      "warning"
    );
    return;
  }

  if (Number(annualIncome) <= 0) {
    showNotification(
      "Annual income must be greater than 0.",
      "warning"
    );
    return;
  }

  if (Number(investmentHorizon) <= 0) {
    showNotification(
      "Investment horizon must be greater than 0.",
      "warning"
    );
    return;
  }

  if (Number(targetAmount) <= 0) {
    showNotification(
      "Target amount must be greater than 0.",
      "warning"
    );
    return;
  }

  try {
    setSubmitting(true);

    if (profileId) {
      await updateProfile(
        profileId,
        profilePayload
      );
    } else {
      const createdProfile =
        await createProfile(
          profilePayload
        );

      setProfileId(createdProfile.id);
    }

    console.log(
      "Current Goal ID:",
      goalId
    );

    const savedGoal =
      await createGoal(goalPayload);

    setGoalId(savedGoal.id);

    showNotification(
      "Profile saved successfully.",
      "success"
    );
  } catch (error) {
    console.error(error);

    showNotification(
      "Unable to save profile.",
      "error"
    );
  } finally {
    setSubmitting(false);
  }
};



return (
  <DashboardLayout>

    <Typography
      variant="h4"
      fontWeight={700}
      mb={10}
    >
      Investor Profile
    </Typography>

    {loading && (
      <PageLoader message="Loading profile..." />
    )}

    {!loading && error && (
      <ServerErrorAlert message={error} />
    )}

    {!loading && (
    <Paper

  sx={{
    p: 4,
    bgcolor: "#131C2F",
    maxWidth: 1000,
    mt:2,
    pt:5,
    borderRadius: 3
  }}
>
        <Typography
          variant="h5"
          pb={2}
         fontWeight={600}
        >
          Goal Information
        </Typography>

        <Grid
          container
          spacing={3}
        >
          <Grid xs={12} md={8}>
            <TextField
              select
              fullWidth
              label="Goal Type"
              value={goalType}
              sx={{
  "& .MuiInputBase-root": {
    width:170
  }
}}
              onChange={(e) =>
                setGoalType(
                  e.target.value
                )
              }
            >
              <MenuItem value="Retirement">
                Retirement
              </MenuItem>

              <MenuItem value="Marriage">
                Marriage
              </MenuItem>

              <MenuItem value="Home Purchase">
                Home Purchase
              </MenuItem>

              <MenuItem value="Car Purchase">
                Car Purchase
              </MenuItem>

              <MenuItem value="Education">
                Education
              </MenuItem>

              <MenuItem value="Other">
                Other
              </MenuItem>
            </TextField>
          </Grid>

          {goalType === "Other" && (
            <Grid xs={12}>
              <TextField
                fullWidth
                label="Custom Goal Name"
                value={customGoal}
                onChange={(e) =>
                  setCustomGoal(
                    e.target.value
                  )
                }
              />
            </Grid>
          )}

          <Grid xs={12} md={6}>
            
            <TextField
              fullWidth
              label="Target Amount ($)"
              type="number"
              value={targetAmount}
              inputProps={{
  min: 1
}}
              sx={{
    "& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button": {
      WebkitAppearance: "none",
      margin: 0
    },
    "& input[type=number]": {
      MozAppearance: "textfield"
    }
  }}
              onChange={(e) =>
                setTargetAmount(
                  e.target.value
                )
              }
            />
          </Grid>

          <Grid  xs={12} md={6}>
            <TextField
  fullWidth
  type="month"
  label="Target Month & Year"
  helperText={`minimum target date: (${minGoalDate})`}
  value={targetDate}
  inputProps={{
    min: minGoalDate
  }}
  onChange={(e) =>
    setTargetDate(
      e.target.value
    )
  }
/>
          </Grid>

          <Grid xs={12} md={6}>
            <TextField
              fullWidth
              label="Current Savings ($)"
              type="number"
              value={currentSavings}
              inputProps={{
                min: 0
              }}
              sx={{
    "& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button": {
      WebkitAppearance: "none",
      margin: 0
    },
    "& input[type=number]": {
      MozAppearance: "textfield"
    }
  }}
              onChange={(e) =>
                setCurrentSavings(
                  e.target.value
                )
              }
            />
          </Grid>

          <Grid xs={12} md={6}>
            <TextField
              fullWidth
              label="Monthly Investment ($)"
              type="number"
              value={monthlyInvestment}
              inputProps={{
                min: 0
              }}
              sx={{
    "& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button": {
      WebkitAppearance: "none",
      margin: 0
    },
    "& input[type=number]": {
      MozAppearance: "textfield"
    }
  }}
              onChange={(e) =>
                setMonthlyInvestment(
                  e.target.value
                )
              }
            />
          </Grid>
        </Grid>

        <Box mt={5}>
          
      <Divider
  sx={{
    my: 5
  }}
/>
          <Typography
            variant="h6"
            mb={3}
            fontWeight={600}
          >
            Investor Information
          </Typography>

          <Grid
            container
            spacing={3}
          >
            <Grid  xs={12} md={6}>
              <TextField
                fullWidth
                label="Age"
                type="number"
                value={age}
                inputProps={{
    min: 18,
    max: 100
  }}
                onChange={(e) =>
                  setAge(
                    e.target.value
                  )
                }
                sx={{
    "& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button": {
      WebkitAppearance: "none",
      margin: 0
    },
    "& input[type=number]": {
      MozAppearance: "textfield"
    }
  }}
              />
            </Grid>

            <Grid  xs={12} md={6}>
              <TextField
                fullWidth
                label="Annual Income ($)"
                type="number"
                value={annualIncome}
                inputProps={{
  min: 1
}}
                sx={{
    "& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button": {
      WebkitAppearance: "none",
      margin: 0
    },
    "& input[type=number]": {
      MozAppearance: "textfield"
    }
  }}
                onChange={(e) =>
                  setAnnualIncome(
                    e.target.value
                  )
                }
              />
            </Grid>

            <Grid  xs={12} md={6}>
              <TextField
                fullWidth
                label="Investment Horizon (Years)"
                type="number"
                value={investmentHorizon}
                inputProps={{
  min: 1,
  max: 100
}}
                sx={{
    "& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button": {
      WebkitAppearance: "none",
      margin: 0
    },
    "& input[type=number]": {
      MozAppearance: "textfield"
    }
  }}
                onChange={(e) =>
                  setInvestmentHorizon(
                    e.target.value
                  )
                }
              />
            </Grid>

            <Grid  xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="Risk Tolerance"
                value={
                  riskTolerance
                }
                sx={{
  "& .MuiInputBase-root": {
    width:150
  }
}}
                onChange={(e) =>
                  setRiskTolerance(
                    e.target.value
                  )
                }
              >
                <MenuItem value="Conservative">
                  Conservative
                </MenuItem>

                <MenuItem value="Moderate">
                  Moderate
                </MenuItem>

                <MenuItem value="Aggressive">
                  Aggressive
                </MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </Box>

        <Button
  variant="contained"
  size="large"
  sx={{ mt: 4 }}
  onClick={handleSubmit}
  disabled={submitting}
>
  {submitting
    ? "Saving..."
    : "Save Investor Profile"}
</Button>
      </Paper>
    )}
    <Snackbar
  open={snackbar.open}
  autoHideDuration={4000}
  onClose={handleSnackbarClose}
  anchorOrigin={{
    vertical: "bottom",
    horizontal: "right"
  }}
>
  <Alert
    onClose={handleSnackbarClose}
    severity={snackbar.severity}
    variant="filled"
    sx={{ width: "100%" }}
  >
    {snackbar.message}
  </Alert>
</Snackbar>
    </DashboardLayout>
  );
}