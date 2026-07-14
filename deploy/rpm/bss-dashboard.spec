Name:           bss-dashboard
Version:        0.1.0
Release:        1%{?dist}
Summary:        Business Security Dashboard offline deployment bundle
License:        Proprietary
Prefix:         /opt/business-security-dashboard
BuildArch:      aarch64
AutoReqProv:    no

Source0:        %{name}-bundle-%{version}.tar.gz

%description
Offline ARM64 deployment bundle for Business Security Dashboard.

%prep
%setup -q -n bss-dashboard-bundle

%install
rm -rf %{buildroot}
mkdir -p %{buildroot}/opt/business-security-dashboard
cp -a . %{buildroot}/opt/business-security-dashboard/
find %{buildroot}/opt/business-security-dashboard -type f -name '*.sh' -exec chmod 0755 {} \;

%files
%defattr(-,root,root,-)
/opt/business-security-dashboard

%changelog
* Tue Jul 14 2026 Business Security Team <security@example.invalid> - 0.1.0-1
- Initial offline ARM64 deployment bundle
