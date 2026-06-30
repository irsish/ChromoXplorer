/*DEPRICATED PAGE - managed thru aws */

import { useState } from "react";
import { Button, Form, FormGroup, Input, Label } from "reactstrap";
import styles from "./AccountForms.module.css";

export default function ChangePasswordForm() {
    const [current, setCurrent] = useState("");
    const [newPass, setNewPass] = useState("");
    const [confirm, setConfirm] = useState("");

    function handleSubmit(e) {
        e.preventDefault();
        if (newPass !== confirm) {
            alert("Passwords do not match!");
            return;
        }
        alert("Password updated!");
    }

    return (
        <Form onSubmit={handleSubmit} className={styles.form}>
            <FormGroup>
                <Label>Current Password</Label>
                <Input type="password"
                    value={current}
                    onChange={(e) => setCurrent(e.target.value)}
                    className={styles.input}
                />
            </FormGroup>

            <FormGroup>
                <Label>New Password</Label>
                <Input type="password"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    className={styles.input}
                />
            </FormGroup>

            <FormGroup>
                <Label>Confirm New Password</Label>
                <Input type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className={styles.input}
                />
            </FormGroup>

            <Button className={styles.purpleButton}>Update Password</Button>
        </Form>
    );
}
