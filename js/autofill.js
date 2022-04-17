const localStorageIndex = 'NuCasTokenEncryptedData';

// https://www.clear-code.com/blog/2019/1/30.html
async function saveKey() {
    let inputData = (new TextEncoder()).encode(prompt('OTPシードを入力してください'));
    if (inputData === null) {
        throw 'canceled';
    }
    let password = 'p1';
    let password_verify = 'pv';

    while (1) {
        password = prompt('パスワードを入力して下さい'); // 例：'開けゴマ'
        if (password === null) {
            throw 'canceled';
        }
        password_verify = prompt('もう一度パスワードを入力して下さい'); // 例：'開けゴマ'

        if (password_verify === null) {
            throw 'canceled';
        }

        if (password !== password_verify) {
            alert('パスワードが一致しません');
        } else {
            break;
        }
    }


    // 文字列をTyped Arrayに変換する。
    let passwordUint8Array = (new TextEncoder()).encode(password);

    // パスワードのハッシュ値を計算する。
    let digest = await crypto.subtle.digest(
        // ハッシュ値の計算に用いるアルゴリズム。
        { name: 'SHA-256' },
        passwordUint8Array
    );

    // 生パスワードからのハッシュ値から、salt付きでハッシュ化するための素材を得る
    let keyMaterial = await crypto.subtle.importKey(
        'raw',
        digest, { name: 'PBKDF2' },
        // 鍵のエクスポートを許可するかどうかの指定。falseでエクスポートを禁止する。
        false,
        // 鍵の用途。ここでは、「鍵の変換に使う」と指定している。
        ['deriveKey']
    );

    // 乱数でsaltを作成する。
    //let salt = crypto.getRandomValues(new Uint8Array(16));
    let salt = stringToUint8Array("the salt is random data added to secret");

    // 素材にsaltを付与して、最終的なWeb Crypto API用の鍵に変換する。
    let secretKey = await crypto.subtle.deriveKey({
            name: 'PBKDF2',
            salt,
            iterations: 100000, // ストレッチングの回数。
            hash: 'SHA-256'
        },
        keyMaterial,
        // アルゴリズム。
        { name: 'AES-GCM', length: 256 },
        // 鍵のエクスポートを禁止する。
        false,
        // 鍵の用途は、「データの暗号化と復号に使う」と指定。
        ['encrypt', 'decrypt']
    );

    // console.log(secretKey);


    // console.log(inputData);
    let iv = crypto.getRandomValues(new Uint8Array(16));
    let encryptedArrayBuffer = await crypto.subtle.encrypt(
        // 暗号アルゴリズムの指定とパラメータ。
        {
            name: 'AES-GCM',
            iv
        },
        // 事前に用意しておいた鍵。
        secretKey,
        // ArrayBufferまたはTyped Arrayに変換した入力データ。
        inputData
    );
    // console.log(encryptedArrayBuffer);
    let encryptedBytes = Array.from(new Uint8Array(encryptedArrayBuffer), char => String.fromCharCode(char)).join('');
    // console.log(encryptedBytes); // これは保存しないほうがいい

    let encryptedBase64String = btoa(encryptedBytes);
    // console.log(encryptedBase64String); // こっちを保存

    localStorage.setItem(localStorageIndex,
        JSON.stringify({
            data: encryptedBase64String,
            iv: Array.from(iv)
        }));

    /*
    encryptedData = {
        data: encryptedBase64String,
        iv: Array.from(iv)
    };

    console.log(encryptedData);
    */
    alert('トークンの暗号化・保存が完了しました');
}

async function decryptToken() {
    // 復号開始
    let encryptedData = JSON.parse(localStorage.getItem(localStorageIndex));
    /*
    encryptedData = {
        data: encryptedBase64String,
        iv: Array.from(iv)
    };
    */
    let salt = stringToUint8Array("the salt is random data added to secret");

    ///////////
    console.log("bbb");
    let password = prompt('パスワードを入力して下さい'); // 例：'開けゴマ'
    if (password === null) {
        throw 'canceled';
    }

    // 文字列をTyped Arrayに変換する。
    let passwordUint8Array = (new TextEncoder()).encode(password);

    // パスワードのハッシュ値を計算する。
    let digest = await crypto.subtle.digest(
        // ハッシュ値の計算に用いるアルゴリズム。
        { name: 'SHA-256' },
        passwordUint8Array
    );

    // 生パスワードからのハッシュ値から、salt付きでハッシュ化するための素材を得る
    let keyMaterial = await crypto.subtle.importKey(
        'raw',
        digest, { name: 'PBKDF2' },
        // 鍵のエクスポートを許可するかどうかの指定。falseでエクスポートを禁止する。
        false,
        // 鍵の用途。ここでは、「鍵の変換に使う」と指定している。
        ['deriveKey']
    );

    // 乱数でsaltを作成する。
    //let salt = crypto.getRandomValues(new Uint8Array(16));

    // 素材にsaltを付与して、最終的なWeb Crypto API用の鍵に変換する。
    let secretKey = await crypto.subtle.deriveKey({
            name: 'PBKDF2',
            salt,
            iterations: 100000, // ストレッチングの回数。
            hash: 'SHA-256'
        },
        keyMaterial,
        // アルゴリズム。
        { name: 'AES-GCM', length: 256 },
        // 鍵のエクスポートを禁止する。
        false,
        // 鍵の用途は、「データの暗号化と復号に使う」と指定。
        ['encrypt', 'decrypt']
    );

    //console.log(secretKey);
    ///////////
    encryptedBase64String = encryptedData.data;
    // 通常のArrayとして保存しておいた初期ベクトルをUint8Arrayに戻す
    iv = Uint8Array.from(encryptedData.iv);

    // Base64エンコードされた文字列→Binary String
    encryptedBytes = atob(encryptedBase64String);

    // Binary String→Typed Array
    encryptedData = Uint8Array.from(encryptedBytes.split(''), char => char.charCodeAt(0));
    //console.log(encryptedData);
    let decryptedArrayBuffer = await crypto.subtle.decrypt(
        // 暗号アルゴリズムの指定とパラメータ。暗号化時と同じ内容を指定する。
        {
            name: 'AES-GCM',
            iv: iv
        },
        // 暗号化の際に使用した物と同じ鍵。
        secretKey,
        // ArrayBufferまたはTyped Arrayに変換した暗号化済みデータ。
        encryptedData
    );
    //console.log(decryptedArrayBuffer);
    // => ArrayBuffer { byteLength: 27 }
    let decryptedString = (new TextDecoder()).decode(new Uint8Array(decryptedArrayBuffer));
    //console.log(decryptedString);
    return decryptedString;
}

function stringToUint8Array(str) {
    return new TextEncoder("utf-8").encode(str);
}

function submit_form() {
    // 早すぎるとうまくいかなかったから 少し待つ
    setTimeout(function() {
        if (document.getElementsByName("submit").length != 0) {
            document.getElementsByName("submit")[0].click();
        } else if (document.getElementsByName("_eventId_submit").length != 0) {
            document.getElementsByName("_eventId_submit")[0].click();
        }
        console.log("clicked");
    }, 100);
}

async function main() {
    if (localStorage.getItem(localStorageIndex) === null) {
        await saveKey();
    }

    if (document.getElementById("token") && document.getElementById("token").value === '') {
        let token = await decryptToken();
        document.getElementById("token").value = gauth(token);
        submit_form();
    }
}

main();