'use strict'
class KintoneManagerV8 {
  /**
   * kintoneのAPIに関するコンストラクタ
   * @param {string} subdomain - サブドメイン
   * @param {object} apps - アプリケーションの情報
   * @param {string} user (optional) -  ユーザー名 または  authentication information: base64("USER:PASS")
   * @param {string} pass (optional)  - パスワード
   * @constructor
   */
  constructor(subdomain, apps, user, pass) {
    /** @type {string} */
    this.subdomain = subdomain;
    /** @type {string} */
    this.authorization = null;
    /** @type {string} */
    this.apps = apps;

    if (arguments.length > 3) {
      this.authorization = Utilities.base64Encode(user + ":" + pass);
    } else if (arguments.length > 2) {
      // 引数が3つの場合はエンコード済みの認証情報として処理
      this.authorization = user;
    }
  }
  /**
   * kintoneにレコードを追加するメソッド
   * @param {string} appName - アプリの名前
   * @param {Array.<Array.<string>>} records - 登録するレコード https://developer.cybozu.io/hc/ja/articles/202166160
   * @return {HTTPResponse} response - UrlFetchAppの結果 https://developers.google.com/apps-script/reference/url-fetch/http-response
   */
  create(appName, records) {
    const app = this.apps[appName];
    const payload = {
      app: app.appid,
      records: records
    };
    const endpoint = `${this._getEndpoint(app.guestid)}/records.json`;
    const option = this._postOption(app, payload);
    const response = UrlFetchApp.fetch(endpoint, option);
    return response
  }
  /**
   * kintoneからレコードを検索するメソッド
   * @param {string} appName - アプリの名前
   * @param {string} query - 検索するクエリ https://developer.cybozu.io/hc/ja/articles/202331474
   * @return {HTTPResponse} response - UrlFetchAppの結果 https://developers.google.com/apps-script/reference/url-fetch/http-response
   */
  search(appName, query) {
    const q = encodeURIComponent(query);
    const app = this.apps[appName];
    const endpoint = `${this._getEndpoint(app.guestid)}/records.json?app=${app.appid}&query=${q}`;
    const option = this._getOption(app);
    const response = UrlFetchApp.fetch(endpoint, option);
    return response;
  }
  /**
   * kintoneからレコード番号を指定して検索するメソッド
   * @param {string} appName - アプリの名前
   * @param {string} recordId - レコードの番号 https://developer.cybozu.io/hc/ja/articles/202331474
   * @param {string} recordNofieldName - 省略可。デフォルト引数はレコード番号
   * @return {HTTPResponse} response - UrlFetchAppの結果 https://developers.google.com/apps-script/reference/url-fetch/http-response
   */
  searchById(app_name, recordId, recordNofieldName = "レコード番号") {
    const query = `${recordNofieldName}=${recordId}`;
    return this.search(app_name, query);
  }
  /**
   * kintoneに登録されたレコードを更新するメソッド
   * @param {string} appName - アプリの名前
   * @param {Array.<Array.<string>>} records - 登録するレコード https://developer.cybozu.io/hc/ja/articles/201941784
   * @return {HTTPResponse} response - UrlFetchAppの結果 https://developers.google.com/apps-script/reference/url-fetch/http-response
   */
  update(appName, records) {
    const app = this.apps[appName];
    const payload = {
      app: app.appid,
      records: records
    };
    const endpoint = `${this._getEndpoint(app.guestid)}/records.json`;
    const option = this._putOption(app, payload);
    const response = UrlFetchApp.fetch(endpoint, option);
    return response;
  }
  /**
   * kintoneに登録されたレコードを削除するメソッド(最大100件まで)
   * @param {string} appName - アプリの名前
   * @param {Array.string} recordIds - 削除するレコードのIDの配列 https://developer.cybozu.io/hc/ja/articles/201941794
   * @return {HTTPResponse} response - UrlFetchAppの結果 https://developers.google.com/apps-script/reference/url-fetch/http-response
   */
  destroy(appName, recordIds) {
    const app = this.apps[appName];
    const payload = {
      app: app.appid,
      ids: recordIds
    };
    const endpoint = `${this._getEndpoint(app.guestid)}/records.json`;
    const option = this._deleteOption(app, payload);
    const response = UrlFetchApp.fetch(endpoint, option);
    return response;
  }


  /**
   * kintoneにレコードを追加するメソッド
   * 戻り値はresponseのJSONを変換したオブジェクト
   * @param {string} appName - アプリの名前
   * @param {Array.<Array.<string>>} records - 登録するレコード https://developer.cybozu.io/hc/ja/articles/202166160
   * @return {Object} Object - 変換後のObject
   */
  getCreateResultObject(appName, records) {
    const response = this.create(appName, records)
    return this.getAsObject(response)
  }
  /**
   * kintoneからレコードを検索するメソッド
   * 戻り値はresponseのJSONを変換したオブジェクト
   * @param {string} appName - アプリの名前 
   * @param {string} query - 検索するクエリ https://developer.cybozu.io/hc/ja/articles/202331474
   * @return {Object} Object - 変換後のObject
   */
  getSearchResultObject(appName, query) {
    const response = this.search(appName, query)
    return this.getAsObject(response)
  }
  /**
   * kintoneからレコード番号を指定して検索するメソッド
   * 戻り値はresponseのJSONを変換したオブジェクト
   * @param {string} appName - アプリの名前
   * @param {string} recordId - レコードID https://developer.cybozu.io/hc/ja/articles/202331474
   * @param {string} recordNofieldName - 省略可。デフォルト引数は｢レコード番号｣
   * @return {Object} Object - 変換後のObject
   */
  getSearchByIdResultObject(app_name, recordId, recordNofieldName = "レコード番号") {
    const response = this.searchById(app_name, recordId, recordNofieldName)
    return this.getAsObject(response)
  }
  /**
   * kintoneに登録されたレコードを更新するメソッド
   * 戻り値はresponseのJSONを変換したオブジェクト
   * @param {string} appName - アプリの名前
   * @param {Array.<Array.<string>>} records - 登録するレコード https://developer.cybozu.io/hc/ja/articles/201941784
   * @return {Object} Object - 変換後のObject
   */
  getUpdateResultObject(appName, records) {
    const response = this.update(appName, records)
    return this.getAsObject(response)
  }
  /**
   * kintoneに登録されたレコードを削除するメソッド(最大100件まで)
   * 戻り値はresponseのJSONを変換したオブジェクト(成功した場合は{})
   * @param {string} appName - アプリの名前
   * @param {Array.string} recordIds - 削除するレコードのIDの配列 https://developer.cybozu.io/hc/ja/articles/201941794
   * @return {Object} Object - 変換後のObject
   */
  getDestroyResultObject(appName, recordIds) {
    const response = this.destroy(appName, recordIds)
    return this.getAsObject(response)
  }
  /**
   * UrlFetchApp を利用して取得したresponseをオブジェクト化して返す関数
   * @param {string} response - 
   * @return {Object} - Object 変換後のObject
   */
  getAsObject(response) {
    const json = response.getContentText();
    const responceCode = response.getResponseCode();
    if(responceCode === 200){
      const object = JSON.parse(json);
      return object;
    }else if(responceCode === 401){
      throw new Error("認証エラーです。");
    }else{
      throw new Error(json);
    }

  }
  /**
   * 登録されているレコードを1件取得して､レコードを登録するためのテンプレートとなるJSONをログ出力します｡
   */
  getRecordTemplateJson() {
    const searchresponse = this.getSearchResultObject(appName, "")
    const record = searchresponse.records[[0]];

    delete record['レコード番号'];
    delete record['更新者'];
    delete record['作成者'];
    delete record['$revision'];
    delete record['更新日時'];
    delete record['作成日時'];
    delete record['$id'];

    for (const [_, value] of Object.entries(record)) {
      delete value.type;
    }
    console.log(record);
    return
  }


  /**
   * GETする時のオプションを作成するサブメソッド
   * @param {Object} app - app
   * @return {Object} option - option
   * @private
   */
  _getOption(app) {
    const option = {
      method: "get",
      headers: this._authorizationHeader(app),
      muteHttpExceptions: true
    };
    return option;
  }

  /**
   * POSTする時のオプションを作成するサブメソッド
   * @param {Object} app - app
   * @param {Object} payload - payload
   * @return {Object} option - option
   * @private
   */
  _postOption(app, payload) {
    const option = {
      method: "post",
      contentType: "application/json",
      headers: this._authorizationHeader(app),
      muteHttpExceptions: true,
      payload: JSON.stringify(payload)
    };
    return option;
  }

  /**
   * putする時のオプションを作成するサブメソッド
   * @param {Object} app - app
   * @param {Object} payload - payload
   * @return {Object} option - option
   * @private
   */
  _putOption(app, payload) {
    const option = {
      method: "put",
      contentType: "application/json",
      headers: this._authorizationHeader(app),
      muteHttpExceptions: true,
      payload: JSON.stringify(payload)
    };
    return option;
  }

  /**
   * deleteする時のオプションを作成するサブメソッド
   * @param {Object} app - app
   * @param {Object} payload - payload
   * @return {Object} option - option
   * @private
   */
  _deleteOption(app, payload) {
    const option = {
      method: "DELETE",
      contentType: "application/json",
      headers: this._authorizationHeader(app),
      muteHttpExceptions: true,
      payload: JSON.stringify(payload)
    };
    return option;
  }

  /**
   * kintoneのエンドポイントを作成するサブメソッド
   * @param {string} guestid (optional)  - ゲストID
   * @return {string} endpoint - エンドポイント
   * @private
   */
  _getEndpoint(guestid) {
    let endpoint = `https://${this.subdomain}.cybozu.com`
    if (guestid == null) {
      endpoint += "/k/v1";
      return endpoint
    } else {
      endpoint = `${endpoint}/k/guest/${guestid}/v1`
      return endpoint
    }
  }
  /**
   * kintoneの認証情報を作成するサブメソッド
   * @param {string} app - アプリの名前
   * @return {Object}
   * @private
   */
  _authorizationHeader(app) {
    let auth = {};
    if (this.authorization) {
      // Password authentication
      auth["X-Cybozu-Authorization"] = this.authorization;
    } else if (app.token) {
      // API token authentication
      auth["X-Cybozu-API-Token"] = app.token;
    } else {
      throw new Error("kintone APIを呼ぶための認証情報がありません。");
    }
    //ベーシック認証
    if(app.basicUserName){
      auth["Authorization"] = "Basic " + Utilities.base64Encode(app.basicUserName + ":" + app.basicPass);
    }
    return auth;
  }
}