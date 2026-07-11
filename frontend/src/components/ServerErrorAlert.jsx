import { Alert } from "@mui/material";

export default function ServerErrorAlert({ message }) {
    return <Alert severity="error">{message}</Alert>;
}