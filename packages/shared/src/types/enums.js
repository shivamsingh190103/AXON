export var Plan;
(function (Plan) {
    Plan["FREE"] = "FREE";
    Plan["CREATOR"] = "CREATOR";
    Plan["PRO"] = "PRO";
})(Plan || (Plan = {}));
export var SourceType;
(function (SourceType) {
    SourceType["FILE"] = "FILE";
    SourceType["YOUTUBE_URL"] = "YOUTUBE_URL";
})(SourceType || (SourceType = {}));
export var AnalysisStatus;
(function (AnalysisStatus) {
    AnalysisStatus["QUEUED"] = "QUEUED";
    AnalysisStatus["DOWNLOADING"] = "DOWNLOADING";
    AnalysisStatus["EXTRACTING_FEATURES"] = "EXTRACTING_FEATURES";
    AnalysisStatus["RUNNING_TRIBE"] = "RUNNING_TRIBE";
    AnalysisStatus["SCORING"] = "SCORING";
    AnalysisStatus["GENERATING_INSIGHTS"] = "GENERATING_INSIGHTS";
    AnalysisStatus["COMPLETED"] = "COMPLETED";
    AnalysisStatus["FAILED"] = "FAILED";
    AnalysisStatus["CANCELLED"] = "CANCELLED";
})(AnalysisStatus || (AnalysisStatus = {}));
export var Grade;
(function (Grade) {
    Grade["A"] = "A";
    Grade["B"] = "B";
    Grade["C"] = "C";
    Grade["D"] = "D";
})(Grade || (Grade = {}));
export var InsightType;
(function (InsightType) {
    InsightType["BOREDOM_SPIKE"] = "BOREDOM_SPIKE";
    InsightType["EMOTION_PEAK"] = "EMOTION_PEAK";
    InsightType["HOOK_MOMENT"] = "HOOK_MOMENT";
    InsightType["CRITICAL_DROP"] = "CRITICAL_DROP";
})(InsightType || (InsightType = {}));
export var InsightSeverity;
(function (InsightSeverity) {
    InsightSeverity["LOW"] = "LOW";
    InsightSeverity["MEDIUM"] = "MEDIUM";
    InsightSeverity["HIGH"] = "HIGH";
    InsightSeverity["CRITICAL"] = "CRITICAL";
})(InsightSeverity || (InsightSeverity = {}));
