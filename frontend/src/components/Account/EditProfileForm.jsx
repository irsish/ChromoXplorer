/*DEPRICATED PAGE - managed thru aws */

import { useAuth } from "react-oidc-context";
import { useState } from "react";
import { Button, Form, FormGroup, Input, Label } from "reactstrap";
import styles from "./AccountForms.module.css";

export default function EditProfileForm() {
    // const { user, updateUser } = useAuth();
    const auth = useAuth?.();
    const user = auth?.user;
    const updateUser = auth?.updateUser ?? (() => {});

    // const [name, setName] = useState(user.name);
    // const [email, setEmail] = useState(user.email);

    function handleSubmit(e) {
        e.preventDefault();
        updateUser({ ...user, name, email });
        alert("Profile updated!");
    }

    return (
        <Form onSubmit={handleSubmit} className={styles.form}>
            <FormGroup>
                {/* <Label>Name</Label>
                <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={styles.input}
                /> */}
            </FormGroup>

            <FormGroup>
                {/* <Label>Email</Label>
                <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={styles.input}
                /> */}
            </FormGroup>

            <Button className={styles.purpleButton}>Save Changes</Button>
        </Form>
    );
}
