import { useState, useEffect } from "react";

import styles from './index.module.scss'

import { Button } from 'antd';
import logo from './../../logo.svg';


export default function HomePage() {
    const [chromeVersion, setChromeVersion] = useState("")
    const [nodeVersion, setNodeVersion] = useState("")
    const [electronVersion, setElectronVersion] = useState("")

    useEffect(() => {
        if (window.versions !== undefined) {
            setChromeVersion(window.versions.chrome())
            setNodeVersion(window.versions.node())
            setElectronVersion(window.versions.electron())
        }
    }, [])

    return (
        <div>
        <header className={styles.AppHeader}>
            <img src={logo} className={styles.AppLogo} alt="logo" />
            <h1>Hello from Electron renderer!</h1>
            <p id="info">本应用正在使用 Chrome (v{chromeVersion}), Node.js (v{nodeVersion}), Electron (v{electronVersion})</p>
            Title: <input id="title"/>
            <Button type="primary">Set</Button>
            <button type="button" id="btn2">Open a File</button>
            File path: <strong id="filePath"></strong>
        </header>
        </div>
    )
}