// Is function ko 'start-client-daemon.js' import karega
export function getClientHTML(port) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>ChainShare Client</title>
    <style>
        body { font-family: sans-serif; background: #f0f2f5; }
        .container { max-width: 800px; margin: 20px auto; padding: 20px; background: white; border-radius: 8px; }
        input { width: 90%; padding: 10px; font-size: 1em; }
        button { padding: 10px; }
        #downloads { margin-top: 20px; }
        .progress-bar { background: #eee; border-radius: 4px; overflow: hidden; }
        .progress-inner { background: #007bff; color: white; padding: 5px; width: 0%; text-align: center; }
    </style>
</head>
