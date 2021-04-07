import { __awaiter, __rest } from "tslib";
/* eslint-disable max-lines */
import { Severity } from "@sentry/types";
import { logger, SentryError } from "@sentry/utils";
import { NativeModules, Platform } from "react-native";
const { RNSentry } = NativeModules;
/**
 * Our internal interface for calling native functions
 */
export const NATIVE = {
    /**
     * Sending the event over the bridge to native
     * @param event Event
     */
    sendEvent(event) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.enableNative) {
                throw this._DisabledNativeError;
            }
            if (!this.isNativeClientAvailable()) {
                throw this._NativeClientError;
            }
            // Process and convert deprecated levels
            event.level = event.level ? this._processLevel(event.level) : undefined;
            const header = {
                event_id: event.event_id,
                sdk: event.sdk,
            };
            const payload = Object.assign(Object.assign({}, event), { message: {
                    message: event.message,
                } });
            if (NATIVE.platform === "android") {
                const headerString = JSON.stringify(header);
                const payloadString = JSON.stringify(payload);
                let length = payloadString.length;
                try {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    length = yield RNSentry.getStringBytesLength(payloadString);
                }
                catch (_b) {
                    // The native call failed, we do nothing, we have payload.length as a fallback
                }
                const item = {
                    content_type: "application/json",
                    length,
                    type: (_a = payload.type) !== null && _a !== void 0 ? _a : "event",
                };
                const itemString = JSON.stringify(item);
                const envelopeString = `${headerString}\n${itemString}\n${payloadString}`;
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                return RNSentry.captureEnvelope(envelopeString);
            }
            // Serialize and remove any instances that will crash the native bridge such as Spans
            const serializedPayload = JSON.parse(JSON.stringify(payload));
            // The envelope item is created (and its length determined) on the iOS side of the native bridge.
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            return RNSentry.captureEnvelope({
                header,
                payload: serializedPayload,
            });
        });
    },
    /**
     * Starts native with the provided options.
     * @param options ReactNativeOptions
     */
    startWithOptions(_options) {
        return __awaiter(this, void 0, void 0, function* () {
            const options = Object.assign({ enableNative: true, autoInitializeNativeSdk: true }, _options);
            if (!options.autoInitializeNativeSdk) {
                if (options.enableNativeNagger) {
                    logger.warn("Note: Native Sentry SDK was not initialized.");
                }
                return false;
            }
            if (!options.dsn) {
                logger.warn("Warning: No DSN was provided. The Sentry SDK will be disabled. Native SDK will also not be initalized.");
                return false;
            }
            if (!options.enableNative) {
                if (options.enableNativeNagger) {
                    logger.warn("Note: Native Sentry SDK is disabled.");
                }
                this.enableNative = false;
                return false;
            }
            if (!this.isNativeClientAvailable()) {
                throw this._NativeClientError;
            }
            // filter out all the options that would crash native.
            /* eslint-disable @typescript-eslint/unbound-method,@typescript-eslint/no-unused-vars */
            const { beforeSend, beforeBreadcrumb, integrations, defaultIntegrations, transport } = options, filteredOptions = __rest(options, ["beforeSend", "beforeBreadcrumb", "integrations", "defaultIntegrations", "transport"]);
            /* eslint-enable @typescript-eslint/unbound-method,@typescript-eslint/no-unused-vars */
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            return RNSentry.startWithOptions(filteredOptions);
        });
    },
    /**
     * Fetches the release from native
     */
    fetchRelease() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.enableNative) {
                throw this._DisabledNativeError;
            }
            if (!this.isNativeClientAvailable()) {
                throw this._NativeClientError;
            }
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            return RNSentry.fetchRelease();
        });
    },
    /**
     * Fetches the device contexts. Not used on Android.
     */
    deviceContexts() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.enableNative) {
                throw this._DisabledNativeError;
            }
            if (!this.isNativeClientAvailable()) {
                throw this._NativeClientError;
            }
            if (this.platform !== "ios") {
                // Only ios uses deviceContexts, return an empty object.
                return {};
            }
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            return RNSentry.deviceContexts();
        });
    },
    /**
     * Sets log level in native
     * @param level number
     */
    setLogLevel(level) {
        if (!this.enableNative) {
            return;
        }
        if (!this.isNativeClientAvailable()) {
            throw this._NativeClientError;
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        RNSentry.setLogLevel(level);
    },
    /**
     * Triggers a native crash.
     * Use this only for testing purposes.
     */
    crash() {
        if (!this.enableNative) {
            return;
        }
        if (!this.isNativeClientAvailable()) {
            throw this._NativeClientError;
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        RNSentry.crash();
    },
    /**
     * Sets the user in the native scope.
     * Passing null clears the user.
     * @param key string
     * @param value string
     */
    setUser(user) {
        if (!this.enableNative) {
            return;
        }
        if (!this.isNativeClientAvailable()) {
            throw this._NativeClientError;
        }
        // separate and serialze all non-default user keys.
        let defaultUserKeys = null;
        let otherUserKeys = null;
        if (user) {
            const { id, ip_address, email, username } = user, otherKeys = __rest(user, ["id", "ip_address", "email", "username"]);
            defaultUserKeys = this._serializeObject({
                email,
                id,
                ip_address,
                username,
            });
            otherUserKeys = this._serializeObject(otherKeys);
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        RNSentry.setUser(defaultUserKeys, otherUserKeys);
    },
    /**
     * Sets a tag in the native module.
     * @param key string
     * @param value string
     */
    setTag(key, value) {
        if (!this.enableNative) {
            return;
        }
        if (!this.isNativeClientAvailable()) {
            throw this._NativeClientError;
        }
        const stringifiedValue = typeof value === "string" ? value : JSON.stringify(value);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        RNSentry.setTag(key, stringifiedValue);
    },
    /**
     * Sets an extra in the native scope, will stringify
     * extra value if it isn't already a string.
     * @param key string
     * @param extra any
     */
    setExtra(key, extra) {
        if (!this.enableNative) {
            return;
        }
        if (!this.isNativeClientAvailable()) {
            throw this._NativeClientError;
        }
        // we stringify the extra as native only takes in strings.
        const stringifiedExtra = typeof extra === "string" ? extra : JSON.stringify(extra);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        RNSentry.setExtra(key, stringifiedExtra);
    },
    /**
     * Adds breadcrumb to the native scope.
     * @param breadcrumb Breadcrumb
     */
    addBreadcrumb(breadcrumb) {
        if (!this.enableNative) {
            return;
        }
        if (!this.isNativeClientAvailable()) {
            throw this._NativeClientError;
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        RNSentry.addBreadcrumb(Object.assign(Object.assign({}, breadcrumb), { 
            // Process and convert deprecated levels
            level: breadcrumb.level
                ? this._processLevel(breadcrumb.level)
                : undefined, data: breadcrumb.data
                ? this._serializeObject(breadcrumb.data)
                : undefined }));
    },
    /**
     * Clears breadcrumbs on the native scope.
     */
    clearBreadcrumbs() {
        if (!this.enableNative) {
            return;
        }
        if (!this.isNativeClientAvailable()) {
            throw this._NativeClientError;
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        RNSentry.clearBreadcrumbs();
    },
    /**
     * Sets context on the native scope. Not implemented in Android yet.
     * @param key string
     * @param context key-value map
     */
    setContext(key, context) {
        if (!this.enableNative) {
            return;
        }
        if (!this.isNativeClientAvailable()) {
            throw this._NativeClientError;
        }
        if (this.platform === "android") {
            // setContext not available on the Android SDK yet.
            this.setExtra(key, context);
        }
        else {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            RNSentry.setContext(key, context !== null ? this._serializeObject(context) : null);
        }
    },
    /**
     * Serializes all values of root-level keys into strings.
     * @param data key-value map.
     * @returns An object where all root-level values are strings.
     */
    _serializeObject(data) {
        const serialized = {};
        Object.keys(data).forEach((dataKey) => {
            const value = data[dataKey];
            serialized[dataKey] =
                typeof value === "string" ? value : JSON.stringify(value);
        });
        return serialized;
    },
    /**
     * Convert js severity level which has critical and log to more widely supported levels.
     * @param level
     * @returns More widely supported Severity level strings
     */
    _processLevel(level) {
        if (level === Severity.Critical) {
            return Severity.Fatal;
        }
        if (level === Severity.Log) {
            return Severity.Debug;
        }
        return level;
    },
    /**
     * Checks whether the RNSentry module is loaded.
     */
    isModuleLoaded() {
        return !!RNSentry;
    },
    /**
     *  Checks whether the RNSentry module is loaded and the native client is available
     */
    isNativeClientAvailable() {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        return this.isModuleLoaded() && RNSentry.nativeClientAvailable;
    },
    /**
     *  Checks whether the RNSentry module is loaded and native transport is available
     */
    isNativeTransportAvailable() {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        return this.isModuleLoaded() && RNSentry.nativeTransport;
    },
    _DisabledNativeError: new SentryError("Native is disabled"),
    _NativeClientError: new SentryError("Native Client is not available, can't start on native."),
    enableNative: true,
    platform: Platform.OS,
};
//# sourceMappingURL=wrapper.js.map