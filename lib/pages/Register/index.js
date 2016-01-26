import React  from 'react';
import style  from '../Login/style.mcss'
import client from '../../network';

export default React.createClass({

    displayName: 'Register',

    contextTypes: {
        router: React.PropTypes.object,
    },

    getInitialState() {
        return {
            error: false,
            password: '',
            confirm:  '',
        }
    },

    passwordChange(e) {
        var newState = {password: e.target.value};
        this.passwordCheck(e.target.value, this.state.confirm, newState);
        this.setState(newState);
    },

    confirmChange(e) {
        var newState = {confirm: e.target.value};
        this.passwordCheck(this.state.password, e.target.value, newState);
        this.setState(newState);
    },

    passwordCheck(password, confirm, obj) {
        if (password !== confirm) {
            obj.error = 'passwords do not match';
        } else {
            obj.error = false;
        }
    },

    handleSubmit(event) {
        event.preventDefault();
        if (!this.state.error) {
            const user = {};
            ['login', 'firstName', 'lastName', 'email', 'password'].forEach( key => {
                user[key] = this.refs[key].value;
            });
            client.registerUser(user, (error) => {
                if(error) {
                    this.setState({error});
                } else {
                    this.context.router.replace('/Login');
                }
            });
        }
    },

    render() {
        return (
            <center>
                <form className={style.loginForm} onSubmit={this.handleSubmit}>
                    <label className={style.loginLabel}>
                        <input ref="firstName" type="text" placeholder="firstName" required/>
                    </label>
                    <label className={style.loginLabel}>
                        <input ref="lastName" type="text" placeholder="lastName" required/>
                    </label>
                    <label className={style.loginLabel}>
                        <input ref="login" type="text" placeholder="login" required/>
                    </label>
                    <label className={style.loginLabel}>
                        <input ref="email" type="email" placeholder="email" required/>
                    </label>
                    <label className={style.loginLabel}>
                        <input ref="password" type="password" value={this.state.password}
                            onChange={this.passwordChange}
                            placeholder="password" required />
                    </label>
                    <label className={style.loginLabel}>
                        <input ref="confirm" type="password" value={this.state.confirm}
                            onChange={this.confirmChange}
                            placeholder="confirm password" required />
                    </label>
                    <div>
                        <button disabled={!!this.state.error}>Register</button>
                    </div>
                    {!!this.state.error && (
                        <p>{this.state.error}</p>
                    )}
                </form>
            </center>);
    },
});