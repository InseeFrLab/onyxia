import type { ReactNode } from "react";
import { assert, type Equals } from "tsafe/assert";
import { Suspense, lazy } from "react";

const JsonCodeTextEditor = lazy(() => import("./byLanguages/JsonCodeTextEditor"));
const TxtCodeTextEditor = lazy(() => import("./byLanguages/TxtCodeTextEditor"));
const AplCodeTextEditor = lazy(() => import("./byLanguages/AplCodeTextEditor"));
const AsciiArmorCodeTextEditor = lazy(
    () => import("./byLanguages/AsciiArmorCodeTextEditor")
);
const Asn1CodeTextEditor = lazy(() => import("./byLanguages/Asn1CodeTextEditor"));
const AsteriskCodeTextEditor = lazy(() => import("./byLanguages/AsteriskCodeTextEditor"));
const BrainfuckCodeTextEditor = lazy(
    () => import("./byLanguages/BrainfuckCodeTextEditor")
);
const CCodeTextEditor = lazy(() => import("./byLanguages/CCodeTextEditor"));
const CassandraCodeTextEditor = lazy(
    () => import("./byLanguages/CassandraCodeTextEditor")
);
const CeylonCodeTextEditor = lazy(() => import("./byLanguages/CeylonCodeTextEditor"));
const ClojureCodeTextEditor = lazy(() => import("./byLanguages/ClojureCodeTextEditor"));
const CmakeCodeTextEditor = lazy(() => import("./byLanguages/CmakeCodeTextEditor"));
const CobolCodeTextEditor = lazy(() => import("./byLanguages/CobolCodeTextEditor"));
const CoffeeScriptCodeTextEditor = lazy(
    () => import("./byLanguages/CoffeeScriptCodeTextEditor")
);
const CommonLispCodeTextEditor = lazy(
    () => import("./byLanguages/CommonLispCodeTextEditor")
);
const CppCodeTextEditor = lazy(() => import("./byLanguages/CppCodeTextEditor"));
const CrystalCodeTextEditor = lazy(() => import("./byLanguages/CrystalCodeTextEditor"));
const CSharpCodeTextEditor = lazy(() => import("./byLanguages/CSharpCodeTextEditor"));
const CssCodeTextEditor = lazy(() => import("./byLanguages/CssCodeTextEditor"));
const CypherCodeTextEditor = lazy(() => import("./byLanguages/CypherCodeTextEditor"));
const CythonCodeTextEditor = lazy(() => import("./byLanguages/CythonCodeTextEditor"));
const DCodeTextEditor = lazy(() => import("./byLanguages/DCodeTextEditor"));
const DartCodeTextEditor = lazy(() => import("./byLanguages/DartCodeTextEditor"));
const DiffCodeTextEditor = lazy(() => import("./byLanguages/DiffCodeTextEditor"));
const DockerFileCodeTextEditor = lazy(
    () => import("./byLanguages/DockerFileCodeTextEditor")
);
const DtdCodeTextEditor = lazy(() => import("./byLanguages/DtdCodeTextEditor"));
const DylanCodeTextEditor = lazy(() => import("./byLanguages/DylanCodeTextEditor"));
const EbnfCodeTextEditor = lazy(() => import("./byLanguages/EbnfCodeTextEditor"));
const EclCodeTextEditor = lazy(() => import("./byLanguages/EclCodeTextEditor"));
const EiffelCodeTextEditor = lazy(() => import("./byLanguages/EiffelCodeTextEditor"));
const ElmCodeTextEditor = lazy(() => import("./byLanguages/ElmCodeTextEditor"));
const ErlangCodeTextEditor = lazy(() => import("./byLanguages/ErlangCodeTextEditor"));
const EsperCodeTextEditor = lazy(() => import("./byLanguages/EsperCodeTextEditor"));
const Ez80CodeTextEditor = lazy(() => import("./byLanguages/Ez80CodeTextEditor"));
const FactorCodeTextEditor = lazy(() => import("./byLanguages/FactorCodeTextEditor"));
const FclCodeTextEditor = lazy(() => import("./byLanguages/FclCodeTextEditor"));
const ForthCodeTextEditor = lazy(() => import("./byLanguages/ForthCodeTextEditor"));
const FortranCodeTextEditor = lazy(() => import("./byLanguages/FortranCodeTextEditor"));
const FSharpCodeTextEditor = lazy(() => import("./byLanguages/FSharpCodeTextEditor"));
const GasCodeTextEditor = lazy(() => import("./byLanguages/GasCodeTextEditor"));
const GasArmCodeTextEditor = lazy(() => import("./byLanguages/GasArmCodeTextEditor"));
const GherkinCodeTextEditor = lazy(() => import("./byLanguages/GherkinCodeTextEditor"));
const GoCodeTextEditor = lazy(() => import("./byLanguages/GoCodeTextEditor"));
const GpSqlCodeTextEditor = lazy(() => import("./byLanguages/GpSqlCodeTextEditor"));
const GqlCodeTextEditor = lazy(() => import("./byLanguages/GqlCodeTextEditor"));
const GroovyCodeTextEditor = lazy(() => import("./byLanguages/GroovyCodeTextEditor"));
const GssCodeTextEditor = lazy(() => import("./byLanguages/GssCodeTextEditor"));
const HaskellCodeTextEditor = lazy(() => import("./byLanguages/HaskellCodeTextEditor"));
const HaxeCodeTextEditor = lazy(() => import("./byLanguages/HaxeCodeTextEditor"));
const HiveCodeTextEditor = lazy(() => import("./byLanguages/HiveCodeTextEditor"));
const HtmlCodeTextEditor = lazy(() => import("./byLanguages/HtmlCodeTextEditor"));
const HttpCodeTextEditor = lazy(() => import("./byLanguages/HttpCodeTextEditor"));
const HxmlCodeTextEditor = lazy(() => import("./byLanguages/HxmlCodeTextEditor"));
const IdlCodeTextEditor = lazy(() => import("./byLanguages/IdlCodeTextEditor"));
const JavaCodeTextEditor = lazy(() => import("./byLanguages/JavaCodeTextEditor"));
const JavascriptCodeTextEditor = lazy(
    () => import("./byLanguages/JavascriptCodeTextEditor")
);
const Jinja2CodeTextEditor = lazy(() => import("./byLanguages/Jinja2CodeTextEditor"));
const JsonLegacyCodeTextEditor = lazy(
    () => import("./byLanguages/JsonLegacyCodeTextEditor")
);
const JsonldCodeTextEditor = lazy(() => import("./byLanguages/JsonldCodeTextEditor"));
const JuliaCodeTextEditor = lazy(() => import("./byLanguages/JuliaCodeTextEditor"));
const KotlinCodeTextEditor = lazy(() => import("./byLanguages/KotlinCodeTextEditor"));
const LessCodeTextEditor = lazy(() => import("./byLanguages/LessCodeTextEditor"));
const LiveScriptCodeTextEditor = lazy(
    () => import("./byLanguages/LiveScriptCodeTextEditor")
);
const LuaCodeTextEditor = lazy(() => import("./byLanguages/LuaCodeTextEditor"));
const MariaDBCodeTextEditor = lazy(() => import("./byLanguages/MariaDBCodeTextEditor"));
const MathematicaCodeTextEditor = lazy(
    () => import("./byLanguages/MathematicaCodeTextEditor")
);
const MboxCodeTextEditor = lazy(() => import("./byLanguages/MboxCodeTextEditor"));
const MircCodeTextEditor = lazy(() => import("./byLanguages/MircCodeTextEditor"));
const ModelicaCodeTextEditor = lazy(() => import("./byLanguages/ModelicaCodeTextEditor"));
const MscgenCodeTextEditor = lazy(() => import("./byLanguages/MscgenCodeTextEditor"));
const MsgennyCodeTextEditor = lazy(() => import("./byLanguages/MsgennyCodeTextEditor"));
const MsSqlCodeTextEditor = lazy(() => import("./byLanguages/MsSqlCodeTextEditor"));
const MumpsCodeTextEditor = lazy(() => import("./byLanguages/MumpsCodeTextEditor"));
const MySqlCodeTextEditor = lazy(() => import("./byLanguages/MySqlCodeTextEditor"));
const NesCCodeTextEditor = lazy(() => import("./byLanguages/NesCCodeTextEditor"));
const NginxCodeTextEditor = lazy(() => import("./byLanguages/NginxCodeTextEditor"));
const NsisCodeTextEditor = lazy(() => import("./byLanguages/NsisCodeTextEditor"));
const NtriplesCodeTextEditor = lazy(() => import("./byLanguages/NtriplesCodeTextEditor"));
const ObjectiveCCodeTextEditor = lazy(
    () => import("./byLanguages/ObjectiveCCodeTextEditor")
);
const ObjectiveCppCodeTextEditor = lazy(
    () => import("./byLanguages/ObjectiveCppCodeTextEditor")
);
const OCamlCodeTextEditor = lazy(() => import("./byLanguages/OCamlCodeTextEditor"));
const OctaveCodeTextEditor = lazy(() => import("./byLanguages/OctaveCodeTextEditor"));
const OzCodeTextEditor = lazy(() => import("./byLanguages/OzCodeTextEditor"));
const PascalCodeTextEditor = lazy(() => import("./byLanguages/PascalCodeTextEditor"));
const PegjsCodeTextEditor = lazy(() => import("./byLanguages/PegjsCodeTextEditor"));
const PerlCodeTextEditor = lazy(() => import("./byLanguages/PerlCodeTextEditor"));
const PgSqlCodeTextEditor = lazy(() => import("./byLanguages/PgSqlCodeTextEditor"));
const PigCodeTextEditor = lazy(() => import("./byLanguages/PigCodeTextEditor"));
const PlSqlCodeTextEditor = lazy(() => import("./byLanguages/PlSqlCodeTextEditor"));
const PowerShellCodeTextEditor = lazy(
    () => import("./byLanguages/PowerShellCodeTextEditor")
);
const PropertiesCodeTextEditor = lazy(
    () => import("./byLanguages/PropertiesCodeTextEditor")
);
const ProtobufCodeTextEditor = lazy(() => import("./byLanguages/ProtobufCodeTextEditor"));
const PugCodeTextEditor = lazy(() => import("./byLanguages/PugCodeTextEditor"));
const PuppetCodeTextEditor = lazy(() => import("./byLanguages/PuppetCodeTextEditor"));
const PythonCodeTextEditor = lazy(() => import("./byLanguages/PythonCodeTextEditor"));
const QCodeTextEditor = lazy(() => import("./byLanguages/QCodeTextEditor"));
const RLowercaseCodeTextEditor = lazy(
    () => import("./byLanguages/RLowercaseCodeTextEditor")
);
const RCodeTextEditor = lazy(() => import("./byLanguages/RCodeTextEditor"));
const RpmChangesCodeTextEditor = lazy(
    () => import("./byLanguages/RpmChangesCodeTextEditor")
);
const RpmSpecCodeTextEditor = lazy(() => import("./byLanguages/RpmSpecCodeTextEditor"));
const RubyCodeTextEditor = lazy(() => import("./byLanguages/RubyCodeTextEditor"));
const RustCodeTextEditor = lazy(() => import("./byLanguages/RustCodeTextEditor"));
const SasCodeTextEditor = lazy(() => import("./byLanguages/SasCodeTextEditor"));
const SassCodeTextEditor = lazy(() => import("./byLanguages/SassCodeTextEditor"));
const ScalaCodeTextEditor = lazy(() => import("./byLanguages/ScalaCodeTextEditor"));
const SchemeCodeTextEditor = lazy(() => import("./byLanguages/SchemeCodeTextEditor"));
const SCSSCodeTextEditor = lazy(() => import("./byLanguages/SCSSCodeTextEditor"));
const ShaderCodeTextEditor = lazy(() => import("./byLanguages/ShaderCodeTextEditor"));
const ShellCodeTextEditor = lazy(() => import("./byLanguages/ShellCodeTextEditor"));
const SieveCodeTextEditor = lazy(() => import("./byLanguages/SieveCodeTextEditor"));
const SmalltalkCodeTextEditor = lazy(
    () => import("./byLanguages/SmalltalkCodeTextEditor")
);
const SmlCodeTextEditor = lazy(() => import("./byLanguages/SmlCodeTextEditor"));
const SolrCodeTextEditor = lazy(() => import("./byLanguages/SolrCodeTextEditor"));
const SparkSqlCodeTextEditor = lazy(() => import("./byLanguages/SparkSqlCodeTextEditor"));
const SparqlCodeTextEditor = lazy(() => import("./byLanguages/SparqlCodeTextEditor"));
const SpreadsheetCodeTextEditor = lazy(
    () => import("./byLanguages/SpreadsheetCodeTextEditor")
);
const SQLCodeTextEditor = lazy(() => import("./byLanguages/SQLCodeTextEditor"));
const SqliteCodeTextEditor = lazy(() => import("./byLanguages/SqliteCodeTextEditor"));
const SquirrelCodeTextEditor = lazy(() => import("./byLanguages/SquirrelCodeTextEditor"));
const StandardSqlCodeTextEditor = lazy(
    () => import("./byLanguages/StandardSqlCodeTextEditor")
);
const StexCodeTextEditor = lazy(() => import("./byLanguages/StexCodeTextEditor"));
const StexMathCodeTextEditor = lazy(() => import("./byLanguages/StexMathCodeTextEditor"));
const StylusCodeTextEditor = lazy(() => import("./byLanguages/StylusCodeTextEditor"));
const SwiftCodeTextEditor = lazy(() => import("./byLanguages/SwiftCodeTextEditor"));
const TclCodeTextEditor = lazy(() => import("./byLanguages/TclCodeTextEditor"));
const TextileCodeTextEditor = lazy(() => import("./byLanguages/TextileCodeTextEditor"));
const TiddlyWikiCodeTextEditor = lazy(
    () => import("./byLanguages/TiddlyWikiCodeTextEditor")
);
const TikiCodeTextEditor = lazy(() => import("./byLanguages/TikiCodeTextEditor"));
const TlvCodeTextEditor = lazy(() => import("./byLanguages/TlvCodeTextEditor"));
const TomlCodeTextEditor = lazy(() => import("./byLanguages/TomlCodeTextEditor"));
const TroffCodeTextEditor = lazy(() => import("./byLanguages/TroffCodeTextEditor"));
const TtcnCodeTextEditor = lazy(() => import("./byLanguages/TtcnCodeTextEditor"));
const TtcnCfgCodeTextEditor = lazy(() => import("./byLanguages/TtcnCfgCodeTextEditor"));
const TurtleCodeTextEditor = lazy(() => import("./byLanguages/TurtleCodeTextEditor"));
const TypescriptCodeTextEditor = lazy(
    () => import("./byLanguages/TypescriptCodeTextEditor")
);
const VbCodeTextEditor = lazy(() => import("./byLanguages/VbCodeTextEditor"));
const VbScriptCodeTextEditor = lazy(() => import("./byLanguages/VbScriptCodeTextEditor"));
const VbScriptAspCodeTextEditor = lazy(
    () => import("./byLanguages/VbScriptAspCodeTextEditor")
);
const VelocityCodeTextEditor = lazy(() => import("./byLanguages/VelocityCodeTextEditor"));
const VerilogCodeTextEditor = lazy(() => import("./byLanguages/VerilogCodeTextEditor"));
const VhdlCodeTextEditor = lazy(() => import("./byLanguages/VhdlCodeTextEditor"));
const WastCodeTextEditor = lazy(() => import("./byLanguages/WastCodeTextEditor"));
const WebIdlCodeTextEditor = lazy(() => import("./byLanguages/WebIdlCodeTextEditor"));
const XmlCodeTextEditor = lazy(() => import("./byLanguages/XmlCodeTextEditor"));
const XQueryCodeTextEditor = lazy(() => import("./byLanguages/XQueryCodeTextEditor"));
const XuCodeTextEditor = lazy(() => import("./byLanguages/XuCodeTextEditor"));
const YacasCodeTextEditor = lazy(() => import("./byLanguages/YacasCodeTextEditor"));
const YamlCodeTextEditor = lazy(() => import("./byLanguages/YamlCodeTextEditor"));
const Z80CodeTextEditor = lazy(() => import("./byLanguages/Z80CodeTextEditor"));

export type CodeTextEditorLanguage =
    | "JSON"
    | "apl"
    | "asciiArmor"
    | "asn1"
    | "asterisk"
    | "brainfuck"
    | "c"
    | "cassandra"
    | "ceylon"
    | "clojure"
    | "cmake"
    | "cobol"
    | "coffeeScript"
    | "commonLisp"
    | "cpp"
    | "crystal"
    | "csharp"
    | "css"
    | "cypher"
    | "cython"
    | "d"
    | "dart"
    | "diff"
    | "dockerFile"
    | "dtd"
    | "dylan"
    | "ebnf"
    | "ecl"
    | "eiffel"
    | "elm"
    | "erlang"
    | "esper"
    | "ez80"
    | "factor"
    | "fcl"
    | "forth"
    | "fortran"
    | "fSharp"
    | "gas"
    | "gasArm"
    | "gherkin"
    | "go"
    | "gpSQL"
    | "gql"
    | "groovy"
    | "gss"
    | "haskell"
    | "haxe"
    | "hive"
    | "html"
    | "http"
    | "hxml"
    | "idl"
    | "java"
    | "javascript"
    | "jinja2"
    | "json"
    | "jsonld"
    | "julia"
    | "kotlin"
    | "less"
    | "liveScript"
    | "lua"
    | "mariaDB"
    | "mathematica"
    | "mbox"
    | "mirc"
    | "modelica"
    | "mscgen"
    | "msgenny"
    | "msSQL"
    | "mumps"
    | "mySQL"
    | "nesC"
    | "nginx"
    | "nsis"
    | "ntriples"
    | "objectiveC"
    | "objectiveCpp"
    | "oCaml"
    | "octave"
    | "oz"
    | "pascal"
    | "pegjs"
    | "perl"
    | "pgSQL"
    | "pig"
    | "plSQL"
    | "powerShell"
    | "properties"
    | "protobuf"
    | "pug"
    | "puppet"
    | "python"
    | "q"
    | "r"
    | "R"
    | "rpmChanges"
    | "rpmSpec"
    | "ruby"
    | "rust"
    | "sas"
    | "sass"
    | "scala"
    | "scheme"
    | "sCSS"
    | "shader"
    | "shell"
    | "sieve"
    | "smalltalk"
    | "sml"
    | "solr"
    | "sparkSQL"
    | "sparql"
    | "spreadsheet"
    | "SQL"
    | "sqlite"
    | "squirrel"
    | "standardSQL"
    | "stex"
    | "stexMath"
    | "stylus"
    | "swift"
    | "tcl"
    | "textile"
    | "tiddlyWiki"
    | "tiki"
    | "tlv"
    | "toml"
    | "troff"
    | "ttcn"
    | "ttcnCfg"
    | "turtle"
    | "typescript"
    | "vb"
    | "vbScript"
    | "vbScriptASP"
    | "velocity"
    | "verilog"
    | "vhdl"
    | "wast"
    | "webIDL"
    | "xml"
    | "xQuery"
    | "xu"
    | "yacas"
    | "yaml"
    | "z80";

export type Props = {
    className?: string;
    id?: string;
    maxHeight?: number;
    value: string;
    onChange: ((newValue: string) => void) | undefined;
    fallback?: JSX.Element;
    children?: ReactNode;
    language: CodeTextEditorLanguage | undefined;
};

{
    type Props_Expected = Omit<import("../TextEditor").Props, "extensions"> &
        Pick<Props, "language">;

    assert<Equals<Props, Props_Expected>>;
}

export function CodeTextEditor(props: Props) {
    const { language, ...rest } = props;

    return (
        <Suspense fallback={rest.fallback}>
            {(() => {
                switch (language) {
                    case "JSON":
                        return <JsonCodeTextEditor {...rest} />;
                    case "apl":
                        return <AplCodeTextEditor {...rest} />;
                    case "asciiArmor":
                        return <AsciiArmorCodeTextEditor {...rest} />;
                    case "asn1":
                        return <Asn1CodeTextEditor {...rest} />;
                    case "asterisk":
                        return <AsteriskCodeTextEditor {...rest} />;
                    case "brainfuck":
                        return <BrainfuckCodeTextEditor {...rest} />;
                    case "c":
                        return <CCodeTextEditor {...rest} />;
                    case "cassandra":
                        return <CassandraCodeTextEditor {...rest} />;
                    case "ceylon":
                        return <CeylonCodeTextEditor {...rest} />;
                    case "clojure":
                        return <ClojureCodeTextEditor {...rest} />;
                    case "cmake":
                        return <CmakeCodeTextEditor {...rest} />;
                    case "cobol":
                        return <CobolCodeTextEditor {...rest} />;
                    case "coffeeScript":
                        return <CoffeeScriptCodeTextEditor {...rest} />;
                    case "commonLisp":
                        return <CommonLispCodeTextEditor {...rest} />;
                    case "cpp":
                        return <CppCodeTextEditor {...rest} />;
                    case "crystal":
                        return <CrystalCodeTextEditor {...rest} />;
                    case "csharp":
                        return <CSharpCodeTextEditor {...rest} />;
                    case "css":
                        return <CssCodeTextEditor {...rest} />;
                    case "cypher":
                        return <CypherCodeTextEditor {...rest} />;
                    case "cython":
                        return <CythonCodeTextEditor {...rest} />;
                    case "d":
                        return <DCodeTextEditor {...rest} />;
                    case "dart":
                        return <DartCodeTextEditor {...rest} />;
                    case "diff":
                        return <DiffCodeTextEditor {...rest} />;
                    case "dockerFile":
                        return <DockerFileCodeTextEditor {...rest} />;
                    case "dtd":
                        return <DtdCodeTextEditor {...rest} />;
                    case "dylan":
                        return <DylanCodeTextEditor {...rest} />;
                    case "ebnf":
                        return <EbnfCodeTextEditor {...rest} />;
                    case "ecl":
                        return <EclCodeTextEditor {...rest} />;
                    case "eiffel":
                        return <EiffelCodeTextEditor {...rest} />;
                    case "elm":
                        return <ElmCodeTextEditor {...rest} />;
                    case "erlang":
                        return <ErlangCodeTextEditor {...rest} />;
                    case "esper":
                        return <EsperCodeTextEditor {...rest} />;
                    case "ez80":
                        return <Ez80CodeTextEditor {...rest} />;
                    case "factor":
                        return <FactorCodeTextEditor {...rest} />;
                    case "fcl":
                        return <FclCodeTextEditor {...rest} />;
                    case "forth":
                        return <ForthCodeTextEditor {...rest} />;
                    case "fortran":
                        return <FortranCodeTextEditor {...rest} />;
                    case "fSharp":
                        return <FSharpCodeTextEditor {...rest} />;
                    case "gas":
                        return <GasCodeTextEditor {...rest} />;
                    case "gasArm":
                        return <GasArmCodeTextEditor {...rest} />;
                    case "gherkin":
                        return <GherkinCodeTextEditor {...rest} />;
                    case "go":
                        return <GoCodeTextEditor {...rest} />;
                    case "gpSQL":
                        return <GpSqlCodeTextEditor {...rest} />;
                    case "gql":
                        return <GqlCodeTextEditor {...rest} />;
                    case "groovy":
                        return <GroovyCodeTextEditor {...rest} />;
                    case "gss":
                        return <GssCodeTextEditor {...rest} />;
                    case "haskell":
                        return <HaskellCodeTextEditor {...rest} />;
                    case "haxe":
                        return <HaxeCodeTextEditor {...rest} />;
                    case "hive":
                        return <HiveCodeTextEditor {...rest} />;
                    case "html":
                        return <HtmlCodeTextEditor {...rest} />;
                    case "http":
                        return <HttpCodeTextEditor {...rest} />;
                    case "hxml":
                        return <HxmlCodeTextEditor {...rest} />;
                    case "idl":
                        return <IdlCodeTextEditor {...rest} />;
                    case "java":
                        return <JavaCodeTextEditor {...rest} />;
                    case "javascript":
                        return <JavascriptCodeTextEditor {...rest} />;
                    case "jinja2":
                        return <Jinja2CodeTextEditor {...rest} />;
                    case "json":
                        return <JsonLegacyCodeTextEditor {...rest} />;
                    case "jsonld":
                        return <JsonldCodeTextEditor {...rest} />;
                    case "julia":
                        return <JuliaCodeTextEditor {...rest} />;
                    case "kotlin":
                        return <KotlinCodeTextEditor {...rest} />;
                    case "less":
                        return <LessCodeTextEditor {...rest} />;
                    case "liveScript":
                        return <LiveScriptCodeTextEditor {...rest} />;
                    case "lua":
                        return <LuaCodeTextEditor {...rest} />;
                    case "mariaDB":
                        return <MariaDBCodeTextEditor {...rest} />;
                    case "mathematica":
                        return <MathematicaCodeTextEditor {...rest} />;
                    case "mbox":
                        return <MboxCodeTextEditor {...rest} />;
                    case "mirc":
                        return <MircCodeTextEditor {...rest} />;
                    case "modelica":
                        return <ModelicaCodeTextEditor {...rest} />;
                    case "mscgen":
                        return <MscgenCodeTextEditor {...rest} />;
                    case "msgenny":
                        return <MsgennyCodeTextEditor {...rest} />;
                    case "msSQL":
                        return <MsSqlCodeTextEditor {...rest} />;
                    case "mumps":
                        return <MumpsCodeTextEditor {...rest} />;
                    case "mySQL":
                        return <MySqlCodeTextEditor {...rest} />;
                    case "nesC":
                        return <NesCCodeTextEditor {...rest} />;
                    case "nginx":
                        return <NginxCodeTextEditor {...rest} />;
                    case "nsis":
                        return <NsisCodeTextEditor {...rest} />;
                    case "ntriples":
                        return <NtriplesCodeTextEditor {...rest} />;
                    case "objectiveC":
                        return <ObjectiveCCodeTextEditor {...rest} />;
                    case "objectiveCpp":
                        return <ObjectiveCppCodeTextEditor {...rest} />;
                    case "oCaml":
                        return <OCamlCodeTextEditor {...rest} />;
                    case "octave":
                        return <OctaveCodeTextEditor {...rest} />;
                    case "oz":
                        return <OzCodeTextEditor {...rest} />;
                    case "pascal":
                        return <PascalCodeTextEditor {...rest} />;
                    case "pegjs":
                        return <PegjsCodeTextEditor {...rest} />;
                    case "perl":
                        return <PerlCodeTextEditor {...rest} />;
                    case "pgSQL":
                        return <PgSqlCodeTextEditor {...rest} />;
                    case "pig":
                        return <PigCodeTextEditor {...rest} />;
                    case "plSQL":
                        return <PlSqlCodeTextEditor {...rest} />;
                    case "powerShell":
                        return <PowerShellCodeTextEditor {...rest} />;
                    case "properties":
                        return <PropertiesCodeTextEditor {...rest} />;
                    case "protobuf":
                        return <ProtobufCodeTextEditor {...rest} />;
                    case "pug":
                        return <PugCodeTextEditor {...rest} />;
                    case "puppet":
                        return <PuppetCodeTextEditor {...rest} />;
                    case "python":
                        return <PythonCodeTextEditor {...rest} />;
                    case "q":
                        return <QCodeTextEditor {...rest} />;
                    case "r":
                        return <RLowercaseCodeTextEditor {...rest} />;
                    case "R":
                        return <RCodeTextEditor {...rest} />;
                    case "rpmChanges":
                        return <RpmChangesCodeTextEditor {...rest} />;
                    case "rpmSpec":
                        return <RpmSpecCodeTextEditor {...rest} />;
                    case "ruby":
                        return <RubyCodeTextEditor {...rest} />;
                    case "rust":
                        return <RustCodeTextEditor {...rest} />;
                    case "sas":
                        return <SasCodeTextEditor {...rest} />;
                    case "sass":
                        return <SassCodeTextEditor {...rest} />;
                    case "scala":
                        return <ScalaCodeTextEditor {...rest} />;
                    case "scheme":
                        return <SchemeCodeTextEditor {...rest} />;
                    case "sCSS":
                        return <SCSSCodeTextEditor {...rest} />;
                    case "shader":
                        return <ShaderCodeTextEditor {...rest} />;
                    case "shell":
                        return <ShellCodeTextEditor {...rest} />;
                    case "sieve":
                        return <SieveCodeTextEditor {...rest} />;
                    case "smalltalk":
                        return <SmalltalkCodeTextEditor {...rest} />;
                    case "sml":
                        return <SmlCodeTextEditor {...rest} />;
                    case "solr":
                        return <SolrCodeTextEditor {...rest} />;
                    case "sparkSQL":
                        return <SparkSqlCodeTextEditor {...rest} />;
                    case "sparql":
                        return <SparqlCodeTextEditor {...rest} />;
                    case "spreadsheet":
                        return <SpreadsheetCodeTextEditor {...rest} />;
                    case "SQL":
                        return <SQLCodeTextEditor {...rest} />;
                    case "sqlite":
                        return <SqliteCodeTextEditor {...rest} />;
                    case "squirrel":
                        return <SquirrelCodeTextEditor {...rest} />;
                    case "standardSQL":
                        return <StandardSqlCodeTextEditor {...rest} />;
                    case "stex":
                        return <StexCodeTextEditor {...rest} />;
                    case "stexMath":
                        return <StexMathCodeTextEditor {...rest} />;
                    case "stylus":
                        return <StylusCodeTextEditor {...rest} />;
                    case "swift":
                        return <SwiftCodeTextEditor {...rest} />;
                    case "tcl":
                        return <TclCodeTextEditor {...rest} />;
                    case "textile":
                        return <TextileCodeTextEditor {...rest} />;
                    case "tiddlyWiki":
                        return <TiddlyWikiCodeTextEditor {...rest} />;
                    case "tiki":
                        return <TikiCodeTextEditor {...rest} />;
                    case "tlv":
                        return <TlvCodeTextEditor {...rest} />;
                    case "toml":
                        return <TomlCodeTextEditor {...rest} />;
                    case "troff":
                        return <TroffCodeTextEditor {...rest} />;
                    case "ttcn":
                        return <TtcnCodeTextEditor {...rest} />;
                    case "ttcnCfg":
                        return <TtcnCfgCodeTextEditor {...rest} />;
                    case "turtle":
                        return <TurtleCodeTextEditor {...rest} />;
                    case "typescript":
                        return <TypescriptCodeTextEditor {...rest} />;
                    case "vb":
                        return <VbCodeTextEditor {...rest} />;
                    case "vbScript":
                        return <VbScriptCodeTextEditor {...rest} />;
                    case "vbScriptASP":
                        return <VbScriptAspCodeTextEditor {...rest} />;
                    case "velocity":
                        return <VelocityCodeTextEditor {...rest} />;
                    case "verilog":
                        return <VerilogCodeTextEditor {...rest} />;
                    case "vhdl":
                        return <VhdlCodeTextEditor {...rest} />;
                    case "wast":
                        return <WastCodeTextEditor {...rest} />;
                    case "webIDL":
                        return <WebIdlCodeTextEditor {...rest} />;
                    case "xml":
                        return <XmlCodeTextEditor {...rest} />;
                    case "xQuery":
                        return <XQueryCodeTextEditor {...rest} />;
                    case "xu":
                        return <XuCodeTextEditor {...rest} />;
                    case "yacas":
                        return <YacasCodeTextEditor {...rest} />;
                    case "yaml":
                        return <YamlCodeTextEditor {...rest} />;
                    case "z80":
                        return <Z80CodeTextEditor {...rest} />;
                    case undefined:
                        return <TxtCodeTextEditor {...rest} />;
                    default:
                        assert<Equals<typeof language, never>>(false);
                }
            })()}
        </Suspense>
    );
}
