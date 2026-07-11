import { useEffect, useState } from "react";
import {
  Typography,
  CircularProgress,
  Box,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  LinearProgress,
  Snackbar,
  Alert,
  Divider,
  Card,
  CardContent,
  Paper
} from "@mui/material";

import DashboardLayout from "../layouts/DashboardLayout";
import ServerErrorAlert from "../components/ServerErrorAlert";
import { GUIDANCE } from "../components/guidanceUtils";
import { classifyApiError } from "../utils/apiErrors";

import {
  getGoals
} from "../services/analyticsService";
import {
  createGoal,
  updateGoal,
  deleteGoal
} from "../services/goalService";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

const formatAmount = (value) => currencyFormatter.format(Number(value || 0));

export default function GoalsPage() {
  const [goal, setGoal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Dialog State
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formValues, setFormValues] = useState({
    goal_type: "Retirement",
    custom_name: "",
    target_amount: "",
    target_date: "",
    current_amount: "",
    monthly_contribution: "",
    annual_income: ""
  });
  const [formErrors, setFormErrors] = useState({});

  // Delete State
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  // Snackbar State
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success"
  });

  const today = new Date();
  const minGoalDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  const fetchGoalsAndDetails = async () => {
    try {
      const fetchedGoals = await getGoals();
      const [userGoal] = fetchedGoals;
      setGoal(userGoal ?? null);
    } catch (err) {
      console.error(err);
      setError(classifyApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      fetchGoalsAndDetails();
    }, 0);
  }, []);

  const handleSnackbarClose = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const showNotification = (message, severity = "success") => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleOpenCreate = () => {
    setIsEditMode(false);
    setFormValues({
      goal_type: "Retirement",
      custom_name: "",
      target_amount: "",
      target_date: minGoalDate,
      current_amount: "",
      monthly_contribution: "",
      annual_income: ""
    });
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleOpenEdit = () => {
    if (!goal) return;
    setIsEditMode(true);
    setFormValues({
      goal_type: goal.goal_type,
      custom_name: goal.goal_type === "Other" ? goal.goal_name : "",
      target_amount: String(goal.target_amount),
      target_date: goal.target_date.substring(0, 7),
      current_amount: String(goal.current_amount),
      monthly_contribution: String(goal.monthly_contribution),
      annual_income: String(goal.annual_income)
    });
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleOpenDelete = () => {
    setOpenDeleteDialog(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formValues.target_amount || Number(formValues.target_amount) <= 0) {
      errors.target_amount = "Target amount must be greater than 0";
    }
    if (!formValues.target_date) {
      errors.target_date = "Target date is required";
    } else {
      const selectedDate = new Date(`${formValues.target_date}-01`);
      const minDate = new Date(`${minGoalDate}-01`);
      if (selectedDate < minDate) {
        errors.target_date = "Target date cannot be in the past";
      }
    }
    if (formValues.current_amount !== "" && Number(formValues.current_amount) < 0) {
      errors.current_amount = "Current savings cannot be negative";
    }
    if (formValues.monthly_contribution !== "" && Number(formValues.monthly_contribution) < 0) {
      errors.monthly_contribution = "Monthly contribution cannot be negative";
    }
    if (formValues.annual_income !== "" && Number(formValues.annual_income) < 0) {
      errors.annual_income = "Annual income cannot be negative";
    }
    if (formValues.goal_type === "Other" && !formValues.custom_name.trim()) {
      errors.custom_name = "Custom goal name is required for 'Other'";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    const userId = Number(localStorage.getItem("userId"));

    const payload = {
      user_id: userId,
      goal_type: formValues.goal_type,
      goal_name: formValues.goal_type === "Other" ? formValues.custom_name : formValues.goal_type,
      target_amount: Number(formValues.target_amount),
      target_date: `${formValues.target_date}-01`,
      current_amount: formValues.current_amount === "" ? 0 : Number(formValues.current_amount),
      monthly_contribution: formValues.monthly_contribution === "" ? 0 : Number(formValues.monthly_contribution),
      annual_income: formValues.annual_income === "" ? 0 : Number(formValues.annual_income)
    };

    try {
      if (isEditMode && goal) {
        await updateGoal(goal.id, payload);
        showNotification("Goal updated successfully.");
      } else {
        await createGoal(payload);
        showNotification("Goal created successfully.");
      }
      setOpenDialog(false);
      setLoading(true);
      await fetchGoalsAndDetails();
    } catch (err) {
      console.error(err);
      showNotification(classifyApiError(err).message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!goal) return;
    setSubmitting(true);
    try {
      await deleteGoal(goal.id);
      showNotification("Goal deleted successfully.");
      setOpenDeleteDialog(false);
      setGoal(null);
    } catch (err) {
      console.error(err);
      showNotification(classifyApiError(err).message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusInfo = (probability) => {
    if (probability >= 80) return { label: "On Track", color: "#22C55E" };
    if (probability >= 50) return { label: "Caution", color: "#F59E0B" };
    return { label: "At Risk", color: "#EF4444" };
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Typography variant="h4" fontWeight={700} mb={4}>
          Financial Goals
        </Typography>
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <Typography variant="h4" fontWeight={700} mb={4}>
          Financial Goals
        </Typography>
        <ServerErrorAlert message={error} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        flexDirection={{ xs: "column", sm: "row" }}
        gap={2}
        mb={4}
      >
        <Typography variant="h4" fontWeight={700}>
          Financial Goals
        </Typography>
        
      </Box>

      {!goal ? (
        // Fixed: previously used GuidancePanel with actionTo="#", which
        // rendered a RouterLink to a dead anchor. This now triggers the
        // real create-goal dialog via handleOpenCreate.
        <Paper
          sx={{
            p: 4,
            maxWidth: 640,
            bgcolor: "background.paper"
          }}
        >
          <Typography variant="h5" fontWeight={700} mb={1}>
            {GUIDANCE.goalNotFound.title}
          </Typography>
          <Typography color="text.secondary" mb={3}>
            {GUIDANCE.goalNotFound.message}
          </Typography>
          <Button variant="contained" onClick={handleOpenCreate}>
            Create Goal Now
          </Button>
        </Paper>
      ) : (
        <Box>
          <Box display="flex" gap={2} mb={4} justifyContent="flex-end">
            <Button variant="outlined" color="primary" onClick={handleOpenEdit}>
              Edit Goal
            </Button>
            <Button variant="outlined" color="error" onClick={handleOpenDelete}>
              Delete Goal
            </Button>
          </Box>

          <Grid container spacing={3}>
            {/* Goal Progress Card */}
            <Grid xs={12} md={6}>
              <Card sx={{ bgcolor: "background.paper", borderRadius: 3, height: "100%" }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h6" fontWeight={700} mb={3}>
                    Goal Progress: {goal.goal_name}
                  </Typography>

                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography color="text.secondary" variant="body2">Current Savings</Typography>
                    <Typography fontWeight={600}>{formatAmount(goal.current_amount)}</Typography>
                  </Box>

                  <Box display="flex" justifyContent="space-between" mb={3}>
                    <Typography color="text.secondary" variant="body2">Target Amount</Typography>
                    <Typography color="primary.main" fontWeight={700}>{formatAmount(goal.target_amount)}</Typography>
                  </Box>

                  <Box mb={4}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography color="text.secondary" variant="caption">Progress</Typography>
                      <Typography color="success.main" variant="caption" fontWeight={600}>
                        {goal.progress_percent != null ? `${goal.progress_percent}%` : "0.0%"}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={goal.progress_percent || 0}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: "rgba(148,163,184,0.12)",
                        "& .MuiLinearProgress-bar": {
                          bgcolor: "success.main",
                          borderRadius: 4
                        }
                      }}
                    />
                  </Box>

                  <Divider sx={{ my: 3 }} />

                  <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                    <Box>
                      <Typography color="text.secondary" variant="caption">Monthly Contribution</Typography>
                      <Typography variant="h6" fontWeight={700} mt={0.5}>
                        {formatAmount(goal.monthly_contribution)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography color="text.secondary" variant="caption">Target Date</Typography>
                      <Typography variant="h6" fontWeight={700} mt={0.5}>
                        {new Date(goal.target_date).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Goal Success Card */}
            <Grid xs={12} md={6}>
              <Card sx={{ bgcolor: "background.paper", borderRadius: 3, height: "100%" }}>
                <CardContent sx={{ p: 4 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h6" fontWeight={700}>
                      Simulation Results
                    </Typography>
                    {goal.success_probability != null && (
                      <Box
                        sx={{
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 2,
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          bgcolor: `${getStatusInfo(goal.success_probability).color}15`,
                          color: getStatusInfo(goal.success_probability).color,
                          border: `1px solid ${getStatusInfo(goal.success_probability).color}30`
                        }}
                      >
                        {getStatusInfo(goal.success_probability).label}
                      </Box>
                    )}
                  </Box>

                  <Box display="flex" flexDirection="column" alignItems="center" my={2}>
                    <Typography color="text.secondary" variant="body2" mb={1}>Success Probability</Typography>
                    <Typography
                      variant="h2"
                      fontWeight={800}
                      sx={{
                        color: goal.success_probability != null ? getStatusInfo(goal.success_probability).color : "text.primary"
                      }}
                    >
                      {goal.success_probability != null ? `${goal.success_probability}%` : "--"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" mt={1} textAlign="center">
                      Probability of achieving your target under Monte Carlo simulations
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 3 }} />

                  <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                    <Box>
                      <Typography color="text.secondary" variant="caption">Projected Future Value</Typography>
                      <Typography variant="h6" fontWeight={700} mt={0.5}>
                        {formatAmount(goal.estimated_future_value)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography color="text.secondary" variant="caption">Projected Gap</Typography>
                      <Typography
                        variant="h6"
                        fontWeight={700}
                        mt={0.5}
                        color={goal.remaining_gap > 0 ? "error.main" : "success.main"}
                      >
                        {formatAmount(goal.remaining_gap)}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Create / Edit Goal Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => !submitting && setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { bgcolor: "background.paper", borderRadius: 3 }
        }}
      >
        <DialogTitle fontWeight={700}>
          {isEditMode ? "Edit Goal" : "Create Goal"}
        </DialogTitle>
        <DialogContent dividers sx={{ py: 3 }}>
          <Grid container spacing={3}>
            <Grid xs={12}>
              <TextField
                select
                fullWidth
                label="Goal Type"
                value={formValues.goal_type}
                onChange={(e) => setFormValues((prev) => ({ ...prev, goal_type: e.target.value }))}
              >
                <MenuItem value="Retirement">Retirement</MenuItem>
                <MenuItem value="Marriage">Marriage</MenuItem>
                <MenuItem value="Home Purchase">Home Purchase</MenuItem>
                <MenuItem value="Car Purchase">Car Purchase</MenuItem>
                <MenuItem value="Education">Education</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </TextField>
            </Grid>

            {formValues.goal_type === "Other" && (
              <Grid xs={12}>
                <TextField
                  fullWidth
                  label="Custom Goal Name"
                  value={formValues.custom_name}
                  error={!!formErrors.custom_name}
                  helperText={formErrors.custom_name}
                  onChange={(e) => setFormValues((prev) => ({ ...prev, custom_name: e.target.value }))}
                />
              </Grid>
            )}

            <Grid xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Target Amount ($)"
                value={formValues.target_amount}
                error={!!formErrors.target_amount}
                helperText={formErrors.target_amount}
                onChange={(e) => setFormValues((prev) => ({ ...prev, target_amount: e.target.value }))}
              />
            </Grid>

            <Grid xs={12} sm={6}>
              <TextField
                fullWidth
                type="month"
                label="Target Month"
                value={formValues.target_date}
                error={!!formErrors.target_date}
                helperText={formErrors.target_date || `Min date: ${minGoalDate}`}
                onChange={(e) => setFormValues((prev) => ({ ...prev, target_date: e.target.value }))}
              />
            </Grid>

            <Grid xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Current Savings ($)"
                value={formValues.current_amount}
                error={!!formErrors.current_amount}
                helperText={formErrors.current_amount}
                onChange={(e) => setFormValues((prev) => ({ ...prev, current_amount: e.target.value }))}
              />
            </Grid>

            <Grid xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Monthly Contribution ($)"
                value={formValues.monthly_contribution}
                error={!!formErrors.monthly_contribution}
                helperText={formErrors.monthly_contribution}
                onChange={(e) => setFormValues((prev) => ({ ...prev, monthly_contribution: e.target.value }))}
              />
            </Grid>

            <Grid xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Annual Income ($)"
                value={formValues.annual_income}
                error={!!formErrors.annual_income}
                helperText={formErrors.annual_income || "Required for simulation risk parameters"}
                onChange={(e) => setFormValues((prev) => ({ ...prev, annual_income: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenDialog(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={submitting} sx={{ minWidth: 80 }}>
            {submitting ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Goal Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => !submitting && setOpenDeleteDialog(false)}
        PaperProps={{
          sx: { bgcolor: "background.paper", borderRadius: 3 }
        }}
      >
        <DialogTitle fontWeight={700}>
          Delete Goal
        </DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            Are you sure you want to delete this goal? This will permanently remove your financial goal and associated success metrics.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenDeleteDialog(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={submitting} sx={{ minWidth: 80 }}>
            {submitting ? <CircularProgress size={24} /> : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </DashboardLayout>
  );
}